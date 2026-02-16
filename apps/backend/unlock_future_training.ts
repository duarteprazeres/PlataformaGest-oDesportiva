import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function unlockFutureTrainings() {
    try {
        const now = new Date();

        // Find ALL trainings that are finalized but scheduled in the future
        const futureLockedTrainings = await prisma.training.findMany({
            where: {
                isFinalized: true,
                scheduledDate: {
                    gte: now
                }
            }
        });

        if (futureLockedTrainings.length === 0) {
            console.log('✅ No locked future trainings found.');
            return;
        }

        console.log(`\n⚠️  Found ${futureLockedTrainings.length} locked future training(s):\n`);

        for (const training of futureLockedTrainings) {
            console.log(`   - ID: ${training.id}`);
            console.log(`     Date: ${training.scheduledDate}`);
            console.log(`     Finalized At: ${training.finalizedAt}\n`);
        }

        // Unlock ALL of them
        const result = await prisma.training.updateMany({
            where: {
                isFinalized: true,
                scheduledDate: {
                    gte: now
                }
            },
            data: {
                isFinalized: false,
                finalizedAt: null,
                finalizedByUserId: null
            }
        });

        console.log(`✅ Successfully unlocked ${result.count} future training(s)!`);
        console.log(`   All future trainings are now unlocked and editable.\n`);
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

unlockFutureTrainings();
