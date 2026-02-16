
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('👪 Creating Parent Test User...');

    // 1. Find Club
    const club = await prisma.club.findUnique({
        where: { subdomain: 'stress-test' }
    });

    if (!club) {
        console.error('❌ Club "stress-test" not found. Run "stress_seed.ts" first.');
        process.exit(1);
    }

    // 2. Find a Team
    const team = await prisma.team.findFirst({
        where: { clubId: club.id }
    });

    if (!team) {
        console.error('❌ No teams found for club.');
        process.exit(1);
    }

    const email = 'pai@teste.pt';
    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create/Upsert Global Parent
    const globalParent = await prisma.globalParent.upsert({
        where: { email },
        update: {},
        create: {
            firstName: 'Pai',
            lastName: 'Teste',
            email,
            passwordHash: hashedPassword
        }
    });

    // 4. Create/Upsert User (Parent)
    const user = await prisma.user.upsert({
        where: {
            clubId_email: {
                clubId: club.id,
                email: email
            }
        },
        update: {},
        create: {
            email,
            passwordHash: hashedPassword,
            firstName: 'Pai',
            lastName: 'Teste',
            role: 'PARENT',
            clubId: club.id,
            globalParentId: globalParent.id
        }
    });

    // 5. Create Athlete
    const athlete = await prisma.athlete.create({
        data: {
            firstName: 'Filho',
            lastName: 'Teste',
            birthDate: new Date('2015-01-01'),
            publicId: `TEST-${Math.floor(Math.random() * 10000)}`,
            globalParentId: globalParent.id
        }
    });

    // 6. Create Player
    await prisma.player.create({
        data: {
            firstName: athlete.firstName,
            lastName: athlete.lastName,
            jerseyNumber: 10,
            preferredPosition: 'FORWARD',
            birthDate: athlete.birthDate,
            gender: 'MALE',
            parentId: user.id,
            clubId: club.id,
            currentTeamId: team.id,
            athleteId: athlete.id
        }
    });

    console.log('\n✅ Parent Test User Created:');
    console.log(`   - Email: ${email}`);
    console.log(`   - Password: ${password}`);
    console.log(`   - Athlete: ${athlete.firstName} ${athlete.lastName}`);
    console.log(`   - Team: ${team.name}`);
    console.log(`\n👉 Login at: http://localhost:3001/portal/login`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
