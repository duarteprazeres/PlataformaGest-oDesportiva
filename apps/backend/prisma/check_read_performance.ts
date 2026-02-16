import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('⏱️  Checking Read Performance...');

    // 1. Get a random team & training
    const team = await prisma.team.findFirst();
    if (!team) throw new Error('No teams found');
    const training = await prisma.training.findFirst({ where: { teamId: team.id } });
    if (!training) throw new Error('No trainings found');

    console.log(`Context: Team ${team.name}, Training ${training.id}`);

    // TEST 1: Dashboard Calendar View (Trainings for a month)
    const t1Start = performance.now();
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');

    const dashboardTrainings = await prisma.training.findMany({
        where: {
            teamId: team.id,
            scheduledDate: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            team: true, // often included
            _count: {
                select: { attendance: true }
            }
        }
    });
    const t1End = performance.now();
    console.log(`[Dashboard] Fetch ${dashboardTrainings.length} trainings: ${(t1End - t1Start).toFixed(2)}ms`);

    // TEST 2: Training Details (Full Load)
    const t2Start = performance.now();
    const trainingDetails = await prisma.training.findUnique({
        where: { id: training.id },
        include: {
            team: true,
            coach: true,
            // Notices are fetched separately in frontend? Let's assume we fetch them here to simulate load or check strict service logic later
            absenceNotices: {
                include: {
                    athlete: true,
                    submittedBy: true
                }
            },
            attendance: {
                include: {
                    player: true
                }
            }
        }
    });
    const t2End = performance.now();
    console.log(`[Details] Fetch single training with ${trainingDetails?.attendance.length} attendance records: ${(t2End - t2Start).toFixed(2)}ms`);

    // TEST 3: Club Statistics (All Players count)
    const t3Start = performance.now();
    const totalPlayers = await prisma.player.count({
        where: { clubId: team.clubId }
    });
    const activeInjuries = await prisma.injury.count({
        where: {
            clubId: team.clubId,
            status: 'INJURED'
        }
    });
    const t3End = performance.now();
    console.log(`[Stats] Count players (${totalPlayers}) and injuries (${activeInjuries}): ${(t3End - t3Start).toFixed(2)}ms`);

}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
