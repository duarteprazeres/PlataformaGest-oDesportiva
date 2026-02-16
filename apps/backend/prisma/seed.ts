import { PrismaClient, PlayerPosition } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive database seed...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.matchCallup.deleteMany();
    await prisma.match.deleteMany();
    await prisma.playerTeamHistory.deleteMany();
    await prisma.player.deleteMany();
    await prisma.team.deleteMany();
    await prisma.season.deleteMany();
    await prisma.transferRequest.deleteMany();
    await prisma.globalParent.deleteMany();
    await prisma.athlete.deleteMany();
    await prisma.user.deleteMany();
    await prisma.club.deleteMany();

    // 1. Create Main Club
    console.log('🏢 Creating club...');
    const club = await prisma.club.create({
        data: {
            name: 'Sporting Clube',
            subdomain: 'sporting',
            email: 'admin@sporting.pt',
            subscriptionPlan: 'PRO',
        },
    });
    console.log(`✅ Club created: ${club.name}`);

    // 2. Create Admin User
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@sporting.pt',
            passwordHash: hashedPassword,
            firstName: 'Admin',
            lastName: 'Sporting',
            role: 'CLUB_ADMIN',
            clubId: club.id,
        },
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);

    // 3. Create Seasons
    console.log('📅 Creating seasons...');
    const currentSeason = await prisma.season.create({
        data: {
            name: '2025/2026',
            startDate: new Date('2025-09-01'),
            endDate: new Date('2026-06-30'),
            isActive: true,
            clubId: club.id,
        },
    });

    const previousSeason = await prisma.season.create({
        data: {
            name: '2024/2025',
            startDate: new Date('2024-09-01'),
            endDate: new Date('2025-06-30'),
            isActive: false,
            clubId: club.id,
        },
    });
    console.log(`✅ Seasons created: ${currentSeason.name}, ${previousSeason.name}`);

    // 4. Create Teams for Current Season
    console.log('⚽ Creating teams...');
    const sub15 = await prisma.team.create({
        data: {
            name: 'Sub-15 Masculino',
            category: 'SUB15',
            seasonId: currentSeason.id,
            clubId: club.id,
        },
    });

    const sub17 = await prisma.team.create({
        data: {
            name: 'Sub-17 Masculino',
            category: 'SUB17',
            seasonId: currentSeason.id,
            clubId: club.id,
        },
    });

    const sub19 = await prisma.team.create({
        data: {
            name: 'Sub-19 Masculino',
            category: 'SUB19',
            seasonId: currentSeason.id,
            clubId: club.id,
        },
    });
    console.log(`✅ Teams created: ${sub15.name}, ${sub17.name}, ${sub19.name}`);

    // 5. Create Parent Users
    console.log('👨‍👩‍👧‍👦 Creating parent users...');
    const parents = [];
    const parentData = [
        { firstName: 'Maria', lastName: 'Silva', email: 'maria.silva@email.pt' },
        { firstName: 'João', lastName: 'Costa', email: 'joao.costa@email.pt' },
        { firstName: 'Ana', lastName: 'Santos', email: 'ana.santos@email.pt' },
        { firstName: 'Carlos', lastName: 'Almeida', email: 'carlos.almeida@email.pt' },
        { firstName: 'Sofia', lastName: 'Ferreira', email: 'sofia.ferreira@email.pt' },
        { firstName: 'Pedro', lastName: 'Mendes', email: 'pedro.mendes@email.pt' },
        { firstName: 'Rita', lastName: 'Oliveira', email: 'rita.oliveira@email.pt' },
        { firstName: 'Manuel', lastName: 'Rodrigues', email: 'manuel.rodrigues@email.pt' },
        { firstName: 'Teresa', lastName: 'Pereira', email: 'teresa.pereira@email.pt' },
    ];

    for (const p of parentData) {
        const parent = await prisma.user.create({
            data: {
                email: p.email,
                passwordHash: await bcrypt.hash('parent123', 10),
                firstName: p.firstName,
                lastName: p.lastName,
                role: 'PARENT',
                clubId: club.id,
            },
        });
        parents.push(parent);
    }
    console.log(`✅ Created ${parents.length} parent users`);

    // 6. Create Players
    console.log('👟 Creating players...');
    const players = [];

    // Sub-15 Players
    const sub15PlayersData = [
        { firstName: 'João', lastName: 'Silva', jerseyNumber: 10, preferredPosition: 'MIDFIELDER' as PlayerPosition, birthDate: new Date('2010-05-15'), parentId: parents[0].id },
        { firstName: 'Pedro', lastName: 'Costa', jerseyNumber: 9, preferredPosition: 'FORWARD' as PlayerPosition, birthDate: new Date('2010-03-20'), parentId: parents[1].id },
        { firstName: 'Miguel', lastName: 'Santos', jerseyNumber: 4, preferredPosition: 'DEFENDER' as PlayerPosition, birthDate: new Date('2010-08-10'), parentId: parents[2].id },
    ];

    for (const p of sub15PlayersData) {
        const player = await prisma.player.create({
            data: {
                firstName: p.firstName,
                lastName: p.lastName,
                jerseyNumber: p.jerseyNumber,
                preferredPosition: p.preferredPosition,
                birthDate: p.birthDate,
                gender: 'MALE',
                parent: { connect: { id: p.parentId } },
                currentTeam: { connect: { id: sub15.id } },
                club: { connect: { id: club.id } },
            },
        });
        players.push(player);
    }

    // Sub-17 Players
    const sub17PlayersData = [
        { firstName: 'Rui', lastName: 'Almeida', jerseyNumber: 8, preferredPosition: 'MIDFIELDER' as PlayerPosition, birthDate: new Date('2008-12-05'), parentId: parents[3].id },
        { firstName: 'André', lastName: 'Ferreira', jerseyNumber: 7, preferredPosition: 'FORWARD' as PlayerPosition, birthDate: new Date('2008-07-22'), parentId: parents[4].id },
        { firstName: 'Carlos', lastName: 'Mendes', jerseyNumber: 3, preferredPosition: 'DEFENDER' as PlayerPosition, birthDate: new Date('2008-01-18'), parentId: parents[5].id },
    ];

    for (const p of sub17PlayersData) {
        const player = await prisma.player.create({
            data: {
                firstName: p.firstName,
                lastName: p.lastName,
                jerseyNumber: p.jerseyNumber,
                preferredPosition: p.preferredPosition,
                birthDate: p.birthDate,
                gender: 'MALE',
                parent: { connect: { id: p.parentId } },
                currentTeam: { connect: { id: sub17.id } },
                club: { connect: { id: club.id } },
            },
        });
        players.push(player);
    }

    // Sub-19 Players
    const sub19PlayersData = [
        { firstName: 'Bruno', lastName: 'Oliveira', jerseyNumber: 11, preferredPosition: 'FORWARD' as PlayerPosition, birthDate: new Date('2006-11-30'), parentId: parents[6].id },
        { firstName: 'Diogo', lastName: 'Rodrigues', jerseyNumber: 6, preferredPosition: 'MIDFIELDER' as PlayerPosition, birthDate: new Date('2006-09-14'), parentId: parents[7].id },
        { firstName: 'Tiago', lastName: 'Pereira', jerseyNumber: 5, preferredPosition: 'DEFENDER' as PlayerPosition, birthDate: new Date('2006-04-25'), parentId: parents[8].id },
    ];

    for (const p of sub19PlayersData) {
        const player = await prisma.player.create({
            data: {
                firstName: p.firstName,
                lastName: p.lastName,
                jerseyNumber: p.jerseyNumber,
                preferredPosition: p.preferredPosition,
                birthDate: p.birthDate,
                gender: 'MALE',
                parent: { connect: { id: p.parentId } },
                currentTeam: { connect: { id: sub19.id } },
                club: { connect: { id: club.id } },
            },
        });
        players.push(player);
    }
    console.log(`✅ Created ${players.length} players`);

    // 7. Create Matches
    console.log('🏟️  Creating matches...');

    // Sub-15 Match (upcoming)
    const match1 = await prisma.match.create({
        data: {
            teamId: sub15.id,
            opponentName: 'FC Porto B',
            matchDate: new Date('2026-02-10'),
            location: 'Estádio Sporting',
            isHomeMatch: true,
            result: 'SCHEDULED',
            clubId: club.id,
        },
    });

    // Sub-17 Match (upcoming)
    const match2 = await prisma.match.create({
        data: {
            teamId: sub17.id,
            opponentName: 'Benfica Sub-17',
            matchDate: new Date('2026-02-12'),
            location: 'Campo Benfica',
            isHomeMatch: false,
            result: 'SCHEDULED',
            clubId: club.id,
        },
    });

    // Sub-19 Match (finished with results)
    const match3 = await prisma.match.create({
        data: {
            teamId: sub19.id,
            opponentName: 'Braga Sub-19',
            matchDate: new Date('2026-01-28'),
            location: 'Estádio Sporting',
            isHomeMatch: true,
            result: 'WIN',
            goalsFor: 3,
            goalsAgainst: 1,
            clubId: club.id,
        },
    });
    console.log(`✅ Created 3 matches`);

    // 8. Create Match Call-Ups
    console.log('📋 Creating match call-ups...');

    // Match 1 call-ups (Sub-15)
    for (let i = 0; i < 3; i++) {
        await prisma.matchCallup.create({
            data: {
                clubId: club.id,
                matchId: match1.id,
                playerId: players[i].id,
                confirmedByParent: i === 0, // First player confirmed
            },
        });
    }

    // Match 2 call-ups (Sub-17)
    for (let i = 3; i < 6; i++) {
        await prisma.matchCallup.create({
            data: {
                clubId: club.id,
                matchId: match2.id,
                playerId: players[i].id,
                confirmedByParent: false,
            },
        });
    }

    // Match 3 call-ups with statistics (Sub-19 - finished match)
    for (let i = 6; i < 9; i++) {
        await prisma.matchCallup.create({
            data: {
                clubId: club.id,
                matchId: match3.id,
                playerId: players[i].id,
                confirmedByParent: true,
                played: true,
                minutesPlayed: 90,
                goalsScored: i === 6 ? 2 : (i === 7 ? 1 : 0), // Bruno: 2 goals, Diogo: 1 goal
                yellowCards: 0,
                redCard: false,
                coachRating: 8 + (i - 6), // Ratings: 8, 9, 10
            },
        });
    }
    console.log(`✅ Created match call-ups with statistics`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - 1 Club: ${club.name}`);
    console.log(`   - 2 Seasons: ${currentSeason.name}, ${previousSeason.name}`);
    console.log(`   - 3 Teams: Sub-15, Sub-17, Sub-19`);
    console.log(`   - 9 Players (3 per team)`);
    console.log(`   - 9 Parent users`);
    console.log(`   - 3 Matches (2 upcoming, 1 finished)`);
    console.log(`   - Match call-ups with statistics for finished match`);
    console.log('\n🔐 Login credentials:');
    console.log(`   Admin: admin@sporting.pt / admin123`);
    console.log(`   Parents: [parent-email] / parent123`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
