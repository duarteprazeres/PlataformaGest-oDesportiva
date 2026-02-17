import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WithdrawalProcessor {
  private readonly logger = new Logger(WithdrawalProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handlePendingWithdrawals() {
    this.logger.debug('Checking for pending withdrawals...');

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Find players pending withdrawal for > 24h
    const pendingPlayers = await this.prisma.player.findMany({
      where: {
        status: 'PENDING_WITHDRAWAL',
        withdrawalRequestedAt: {
          lt: twentyFourHoursAgo,
        },
        isActive: true,
      },
      include: {
        athlete: true,
      },
    });

    if (pendingPlayers.length === 0) {
      this.logger.debug('No pending withdrawals found eligible for processing.');
      return;
    }

    this.logger.log(`Found ${pendingPlayers.length} players eligible for withdrawal processing.`);

    for (const player of pendingPlayers) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // 2. Update status to LEFT and remove from team
          await tx.player.update({
            where: { id: player.id },
            data: {
              status: 'LEFT',
              currentTeamId: null,
              withdrawalRequestedAt: null,
            },
          });

          // 3. Close team history if exists
          // Note: We use the value from the fetched player object, as we haven't updated it yet in memory logic (but updated in DB above)
          // Actually, it is safer to use the player.currentTeamId from the select
          if (player.currentTeamId) {
            await tx.playerTeamHistory.updateMany({
              where: {
                playerId: player.id,
                teamId: player.currentTeamId,
                leftAt: null,
              },
              data: {
                leftAt: new Date(),
              },
            });
          }

          // 4. Release global athlete link (Free Agent)
          if (player.athleteId) {
            await tx.athlete.update({
              where: { id: player.athleteId },
              data: {
                currentClubId: null,
              },
            });
          }

          this.logger.log(
            `Successfully processed withdrawal for player ${player.id} (Athlete: ${player.athleteId})`,
          );
        });
      } catch (error: unknown) {
        this.logger.error(
          `Failed to process withdrawal for player ${player.id}: ${(error as Error).message}`,
          (error as Error).stack,
        );
      }
    }
  }
}
