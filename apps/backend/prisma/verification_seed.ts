import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Setting up verification environment...');

    // 1. Find Admin
    const admin = await prisma.user.findFirst({
        where: { email: 'admin@sporting.pt' }
    });

    if (!admin) {
        throw new Error('Admin user not found. Did you run the seed?');
    }

    // 2. Find Team
    const team = await prisma.team.findFirst({
        where: { name: 'Sub-15 Masculino' }
    });

    if (!team) {
        throw new Error('Team Sub-15 not found.');
    }

    // 3. Assign Admin as Head Coach
    await prisma.team.update({
        where: { id: team.id },
        data: { headCoachId: admin.id }
    });
    console.log('✅ Admin assigned as Head Coach for Sub-15');

    // 4. Create Training
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Set scheduled date (just the date part usually, but DateTime in Prisma handles full timestamp)

    // Set Times
    const startTime = new Date(tomorrow);
    startTime.setHours(18, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(20, 0, 0, 0);

    const training = await prisma.training.create({
        data: {
            title: 'Treino de Verificação',
            objectives: 'Treino para testar ausências',
            scheduledDate: tomorrow,
            startTime: startTime,
            endTime: endTime,
            teamId: team.id,
            clubId: team.clubId,
            location: 'Campo Principal',
            coachId: admin.id // Also assign coach directly to training as backup
        }
    });

    console.log(`✅ Training created: ${training.title} at ${training.scheduledDate}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
