import { PrismaClient, PlayerPosition, AttendanceStatus, AbsenceNoticeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('🔥 STARTING STRESS TEST SEED 🔥');
    const startTime = Date.now();

    // Configuration
    const NUM_TEAMS = 20;
    const PLAYERS_PER_TEAM = 20;
    const TRAININGS_PER_TEAM = 50;

    // Clear Database
    console.log('🗑️  Clearing database...');
    // Delete in order to avoid foreign key constraints
    await prisma.injury.deleteMany();
    await prisma.absenceNotice.deleteMany();
    await prisma.trainingAttendance.deleteMany();
    await prisma.matchCallup.deleteMany();
    await prisma.match.deleteMany();
    await prisma.training.deleteMany();
    await prisma.playerTeamHistory.deleteMany();
    await prisma.player.deleteMany();
    await prisma.transferRequest.deleteMany();
    await prisma.athlete.deleteMany();
    await prisma.team.deleteMany();
    await prisma.season.deleteMany();
    await prisma.user.deleteMany();
    await prisma.globalParent.deleteMany();
    await prisma.club.deleteMany();

    // 1. Create Club
    console.log('🏢 Creating Club...');
    const club = await prisma.club.create({
        data: {
            name: 'Stress Test FC',
            subdomain: 'stress-test',
            email: 'admin@stresstest.pt',
            subscriptionPlan: 'ENTERPRISE',
        },
    });

    // 2. Create Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@stresstest.pt',
            passwordHash: hashedPassword,
            firstName: 'Admin',
            lastName: 'Stress',
            role: 'CLUB_ADMIN',
            clubId: club.id,
        },
    });

    // 3. Create Season
    const season = await prisma.season.create({
        data: {
            name: '2025/2026',
            startDate: new Date('2025-08-01'),
            endDate: new Date('2026-06-30'),
            isActive: true,
            clubId: club.id,
        },
    });

    // 4. Create Teams & Coaches
    console.log(`⚽ Creating ${NUM_TEAMS} Teams...`);
    const teams = [];
    for (let i = 0; i < NUM_TEAMS; i++) {
        const category = i < 5 ? 'SUB10' : i < 10 ? 'SUB13' : i < 15 ? 'SUB15' : 'SUB19';
        const team = await prisma.team.create({
            data: {
                name: `Equipa ${category} ${String.fromCharCode(65 + (i % 5))}`, // e.g., Equipa SUB10 A
                category: category,
                seasonId: season.id,
                clubId: club.id,
                headCoachId: admin.id,
            },
        });
        teams.push(team);
    }

    // 5. Create Players, Parents (User + Global) & Athletes
    console.log(`🏃 Creating ${NUM_TEAMS * PLAYERS_PER_TEAM} Players...`);
    const allPlayers = [];

    for (const team of teams) {
        process.stdout.write('.'); // progress indicator

        for (let i = 0; i < PLAYERS_PER_TEAM; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const email = faker.internet.email({ firstName, lastName, provider: 'stresstest.pt' }) + `.${Date.now()}.${Math.random()}`;

            // 1. Create Global Parent (Required for AbsenceNotice)
            const globalParent = await prisma.globalParent.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    passwordHash: hashedPassword
                }
            });

            // 2. Create User (Parent)
            const parentUser = await prisma.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    firstName,
                    lastName,
                    role: 'PARENT',
                    clubId: club.id,
                    globalParentId: globalParent.id
                }
            });

            // 3. Create Athlete (Required for AbsenceNotice)
            const birthDate = faker.date.birthdate({ min: 10, max: 19, mode: 'age' });
            const athlete = await prisma.athlete.create({
                data: {
                    firstName: faker.person.firstName('male'),
                    lastName: faker.person.lastName('male'),
                    birthDate,
                    publicId: `TEST-${Math.floor(Math.random() * 100000)}`,
                    globalParentId: globalParent.id
                }
            });

            // 4. Create Player
            const player = await prisma.player.create({
                data: {
                    firstName: athlete.firstName,
                    lastName: athlete.lastName,
                    jerseyNumber: faker.number.int({ min: 1, max: 99 }),
                    preferredPosition: faker.helpers.arrayElement(Object.values(PlayerPosition)),
                    birthDate: birthDate,
                    gender: 'MALE',
                    parentId: parentUser.id,
                    clubId: club.id,
                    currentTeamId: team.id,
                    athleteId: athlete.id
                }
            });
            allPlayers.push({ ...player, teamId: team.id, athleteId: athlete.id, globalParentId: globalParent.id });
        }
    }
    console.log('\n✅ Players, Parents & Athletes created.');

    // 6. Create Trainings & Attendance & Notices
    console.log(`📅 Creating ~${NUM_TEAMS * TRAININGS_PER_TEAM} Trainings and Attendance...`);

    let totalAttendance = 0;
    let totalNotices = 0;
    let totalInjuries = 0;

    for (const team of teams) {
        process.stdout.write('T'); // team progress
        const teamPlayers = allPlayers.filter(p => p.teamId === team.id);

        for (let t = 0; t < TRAININGS_PER_TEAM; t++) {
            // Random date in the last year
            const date = faker.date.past({ years: 0.5 });
            const startTime = new Date(date);
            startTime.setHours(18, 0, 0, 0);
            const endTime = new Date(date);
            endTime.setHours(20, 0, 0, 0);

            const training = await prisma.training.create({
                data: {
                    title: `Treino Tático #${t + 1}`,
                    objectives: faker.lorem.sentence(),
                    scheduledDate: date,
                    startTime: startTime,
                    endTime: endTime,
                    teamId: team.id,
                    clubId: club.id,
                    coachId: admin.id,
                    location: 'Centro de Estágio'
                }
            });

            // Attendance for this training
            for (const player of teamPlayers) {
                const rand = Math.random();
                let status: AttendanceStatus = 'PRESENT';
                let justification = null;

                if (rand > 0.95) { // 5% Injured
                    status = 'JUSTIFIED';
                    justification = 'Lesão no joelho';

                    // Interaction: Create Injury Record
                    if (Math.random() > 0.5) { // 50% chance to record injury
                        await prisma.injury.create({
                            data: {
                                clubId: club.id,
                                playerId: player.id,
                                status: 'INJURED',
                                name: 'Entorse',
                                description: 'Entorse no treino/jogo anterior',
                                startDate: date,
                                createdByUserId: admin.id
                            }
                        });
                        totalInjuries++;
                    }

                } else if (rand > 0.90) { // 5% Unjustified Absence
                    status = 'ABSENT';
                } else if (rand > 0.80) { // 10% Justified Absence
                    status = 'JUSTIFIED';
                    justification = faker.lorem.sentence();

                    // Interaction: Parent creates Notice
                    if (Math.random() > 0.5) {
                        const noticeStatus = Math.random() > 0.2 ? AbsenceNoticeStatus.APPROVED : AbsenceNoticeStatus.DISMISSED;
                        await prisma.absenceNotice.create({
                            data: {
                                trainingId: training.id,
                                athleteId: player.athleteId,
                                submittedByParentId: player.globalParentId,

                                type: 'ABSENCE',
                                reason: justification,
                                status: noticeStatus,
                                reviewedByUserId: admin.id, // Always reviewed if not pending
                                reviewedAt: new Date()
                            }
                        });
                        totalNotices++;
                    }
                }

                await prisma.trainingAttendance.create({
                    data: {
                        clubId: club.id,
                        trainingId: training.id,
                        playerId: player.id,
                        status: status,
                        justification: justification
                    }
                });
                totalAttendance++;
            }
        }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`\n\n🏁 STRESS TEST SEED COMPLETE in ${duration.toFixed(2)}s`);
    console.log(`📊 Stats:`);
    console.log(`   - Teams: ${teams.length}`);
    console.log(`   - Players: ${allPlayers.length}`);
    console.log(`   - Trainings: ${NUM_TEAMS * TRAININGS_PER_TEAM}`);
    console.log(`   - Attendance Records: ${totalAttendance}`);
    console.log(`   - Absence Notices: ${totalNotices}`);
    console.log(`   - Injuries: ${totalInjuries}`);
    console.log(`\nLogin with: admin@stresstest.pt / admin123`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
