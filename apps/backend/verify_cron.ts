
import { PrismaService } from './src/database/prisma.service';
import { WithdrawalProcessor } from './src/modules/jobs/withdrawal.processor';
import { randomUUID } from 'crypto';

async function main() {
    const prisma = new PrismaService();
    await prisma.onModuleInit();

    const processor = new WithdrawalProcessor(prisma);

    console.log('--- Setting up Test Data ---');

    // 1. Create a unique Club
    const clubId = randomUUID();
    const subdomain = `test-cron-${Date.now()}`;
    const club = await prisma.club.create({
        data: {
            id: clubId,
            name: 'Test Club Cron',
            subdomain: subdomain,
            email: `admin-${subdomain}@test.com`,
        }
    });

    // 2. Create Global Parent
    const globalParent = await prisma.globalParent.create({
        data: {
            email: `parent-cron-${Date.now()}@test.com`,
            passwordHash: 'hash',
            firstName: 'Global',
            lastName: 'Parent',
        }
    });

    // 3. Create Athlete
    const athlete = await prisma.athlete.create({
        data: {
            publicId: `CRON${Math.floor(Math.random() * 1000)}`,
            firstName: 'Kid',
            lastName: 'Cron',
            birthDate: new Date('2010-01-01'),
            globalParentId: globalParent.id,
            currentClubId: club.id, // Currently bound to club
        }
    });

    // 4. Create Local Parent User
    const parentUser = await prisma.user.create({
        data: {
            clubId: club.id,
            email: globalParent.email,
            passwordHash: 'hash',
            role: 'PARENT',
            firstName: 'Local',
            lastName: 'Parent',
            globalParentId: globalParent.id,
        }
    });

    // 5. Create Player with PENDING_WITHDRAWAL > 24h ago
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

    const player = await prisma.player.create({
        data: {
            clubId: club.id,
            firstName: 'Kid',
            lastName: 'Cron',
            birthDate: new Date('2010-01-01'),
            parentId: parentUser.id,
            athleteId: athlete.id,
            status: 'PENDING_WITHDRAWAL',
            withdrawalRequestedAt: twentyFiveHoursAgo,
            // Create a dummy team history on the fly? No, relation needs team.
            // Let's make a dummy team first.
        }
    });

    // 5b. Create Season and Team
    const season = await prisma.season.create({
        data: {
            clubId: club.id,
            name: '2025/2026',
            startDate: new Date('2025-09-01'),
            endDate: new Date('2026-06-30'),
        }
    });

    const team = await prisma.team.create({
        data: {
            clubId: club.id,
            seasonId: season.id,
            name: 'Cron Team',
        }
    });

    // Update player to be in this team and have history
    await prisma.player.update({
        where: { id: player.id },
        data: { currentTeamId: team.id }
    });

    await prisma.playerTeamHistory.create({
        data: {
            clubId: club.id,
            playerId: player.id,
            teamId: team.id,
            joinedAt: new Date(),
        }
    });

    console.log(`Created Player ${player.id} with status PENDING_WITHDRAWAL requested at ${twentyFiveHoursAgo.toISOString()}`);

    console.log('--- Running WithdrawalProcessor ---');
    await processor.handlePendingWithdrawals();

    console.log('--- Verifying Results ---');
    const updatedPlayer = await prisma.player.findUnique({ where: { id: player.id } });
    const updatedAthlete = await prisma.athlete.findUnique({ where: { id: athlete.id } });
    const updatedHistory = await prisma.playerTeamHistory.findFirst({
        where: { playerId: player.id, teamId: team.id },
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Player Status: ${updatedPlayer?.status}`);
    console.log(`Player Current Team: ${updatedPlayer?.currentTeamId}`);
    console.log(`Athlete Current Club: ${updatedAthlete?.currentClubId}`);
    console.log(`History LeftAt: ${updatedHistory?.leftAt}`);

    if (
        updatedPlayer?.status === 'LEFT' &&
        updatedPlayer?.currentTeamId === null &&
        updatedAthlete?.currentClubId === null &&
        updatedHistory?.leftAt !== null
    ) {
        console.log('SUCCESS: Cron Job logic verified!');
    } else {
        console.error('FAILURE: Logic did not execute as expected.');
        process.exit(1);
    }

    await prisma.onModuleDestroy();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
