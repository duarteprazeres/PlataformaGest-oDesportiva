import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findByEmail(email: string) {
        return this.prisma.user.findFirst({
            where: { email },
        });
    }

    async create(data: CreateUserDto & { clubId: string }) {
        let passwordHash = '';
        if (data.password) {
            passwordHash = await bcrypt.hash(data.password, 10);
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userData } = data;

        return this.prisma.user.create({
            data: {
                ...userData,
                role: userData.role || 'PARENT',
                passwordHash,
            },
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...result } = user;
        return result;
    }

    async update(id: string, data: UpdateUserDto) {
        const user = await this.prisma.user.update({
            where: { id },
            data,
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...result } = user;
        return result;
    }

    async changePassword(id: string, newPassword: string) {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: { passwordHash },
        });
        return { message: 'Password updated successfully' };
    }
}
