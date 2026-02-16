import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findByEmail(email: string) {
        return this.prisma.user.findFirst({
            where: { email },
        });
    }

    async create(data: any) {
        if (data.password) {
            const bcrypt = await import('bcrypt');
            const hash = await bcrypt.hash(data.password, 10);
            data.passwordHash = hash;
            delete data.password;
        }

        return this.prisma.user.create({
            data,
        });
    }

    async findAll(clubId: string) {
        return this.prisma.user.findMany({
            where: { clubId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
            }
        });
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) return null;
        const { passwordHash, ...result } = user;
        return result;
    }

    async update(id: string, data: any) {
        const user = await this.prisma.user.update({
            where: { id },
            data,
        });
        const { passwordHash, ...result } = user;
        return result;
    }

    async changePassword(id: string, newPassword: string) {
        const bcrypt = await import('bcrypt');
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: { passwordHash },
        });
        return { message: 'Password updated successfully' };
    }
}
