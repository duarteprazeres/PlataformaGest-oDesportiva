import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { JwtPayload } from './dto/jwt-payload.interface';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<Omit<User, 'passwordHash'> | null> {
        const user = await this.prisma.user.findFirst({ where: { email } });
        // console.log(`Login attempt for ${email}. User found: ${!!user}`); 
        // Removed logs for security/cleanliness in strict mode or keep as debug

        if (user && user.passwordHash) {
            const isValid = await bcrypt.compare(pass, user.passwordHash);
            if (isValid) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { passwordHash, ...result } = user;
                return result;
            }
        }
        return null;
    }

    async login(user: Omit<User, 'passwordHash'>) {
        const payload: JwtPayload = {
            email: user.email,
            sub: user.id,
            clubId: user.clubId,
            role: user.role,
            globalParentId: user.globalParentId || undefined
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        };
    }
}
