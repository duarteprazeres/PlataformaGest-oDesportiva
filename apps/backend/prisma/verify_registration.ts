import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'test_reg_' + Date.now() + '@email.pt';
    const password = 'password123';
    const firstName = 'Test';
    const lastName = 'Reg';

    console.log(`🧪 Testing Registration for ${email}...`);

    try {
        // 1. Check if exists (mocking service logic)
        const existing = await prisma.globalParent.findUnique({
            where: { email },
        });

        if (existing) {
            console.error('❌ Email already exists (unexpected for unique test email)');
            return;
        }

        // 2. Create
        const hashedPassword = await bcrypt.hash(password, 10);
        const parent = await prisma.globalParent.create({
            data: {
                email,
                passwordHash: hashedPassword,
                firstName,
                lastName,
            },
        });

        console.log(`✅ Registration Successful! Created GlobalParent ID: ${parent.id}`);

        // 3. Cleanup
        await prisma.globalParent.delete({ where: { id: parent.id } });
        console.log('🧹 Cleanup done.');

    } catch (error) {
        console.error('❌ Registration Failed:', error);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
