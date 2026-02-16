import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'maria.silva@email.pt';
    const newPassword = 'parent123';

    console.log(`🔐 Resetting password for ${email}...`);

    const user = await prisma.user.findFirst({
        where: { email }
    });

    if (!user) {
        console.error('❌ User not found!');
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword }
    });

    console.log('✅ Password reset successfully to:', newPassword);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
