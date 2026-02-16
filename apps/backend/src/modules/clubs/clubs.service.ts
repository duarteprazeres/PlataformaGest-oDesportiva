import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Club } from '@prisma/client';

@Injectable()
export class ClubsService {
    constructor(private prisma: PrismaService) { }

    async findBySubdomain(subdomain: string): Promise<Club> {
        const club = await this.prisma.club.findUnique({
            where: { subdomain },
        });
        if (!club) {
            throw new NotFoundException(`Club with subdomain '${subdomain}' not found`);
        }
        return club;
    }

    async create(data: {
        name: string;
        subdomain: string;
        email: string;
        adminName: string;
        adminEmail: string;
        adminPassword: string;
    }) {
        // Check for existing subdomain or email
        const existing = await this.prisma.club.findFirst({
            where: {
                OR: [
                    { subdomain: data.subdomain },
                    { email: data.email }
                ]
            }
        });

        if (existing) {
            throw new ConflictException('Club with this subdomain or email already exists');
        }

        const existingUser = await this.prisma.user.findFirst({
            where: { email: data.adminEmail }
        });
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const bcrypt = await import('bcrypt');
        const passwordHash = await bcrypt.hash(data.adminPassword, 10);

        // Transactional creation
        return this.prisma.$transaction(async (tx) => {
            // 1. Create Club
            const club = await tx.club.create({
                data: {
                    name: data.name,
                    subdomain: data.subdomain,
                    email: data.email,
                },
            });

            // 2. Create Admin User
            // Split adminName into First and Last (naive)
            const nameParts = data.adminName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Admin';

            const user = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    firstName: firstName,
                    lastName: lastName,
                    passwordHash: passwordHash,
                    role: 'CLUB_ADMIN',

                    clubId: club.id,
                },
            });

            return { club, admin: { id: user.id, email: user.email } };
        });
    }
}
