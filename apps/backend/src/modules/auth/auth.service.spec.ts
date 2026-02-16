import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
    let service: AuthService;
    let jwtService: JwtService;
    let prismaService: PrismaService;

    const mockUser: any = {
        id: 'user-uuid',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: '$2b$10$hashedpassword',
        clubId: 'club-uuid',
        role: UserRole.PARENT,
        globalParentId: 'global-parent-uuid',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null,
        avatarUrl: null,
        birthDate: null,
        emailVerified: false,
        nif: null,
        address: null,
        city: null,
        postalCode: null,
        country: null,
    };

    const mockJwtService = {
        sign: jest.fn(() => 'test_token'),
    };

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        },
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: JwtService, useValue: mockJwtService },
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jwtService = module.get<JwtService>(JwtService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateUser', () => {
        it('should return user without password if validation is successful', async () => {
            jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
            // Mock bcrypt compare to return true
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

            const result = await service.validateUser('test@example.com', 'password');

            expect(result).toBeDefined();
            expect(result).not.toBeNull();
            if (result) {
                expect(result.email).toBe(mockUser.email);
                expect(result).not.toHaveProperty('passwordHash');
            }
        });

        it('should return null if user not found', async () => {
            jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

            const result = await service.validateUser('wrong@example.com', 'password');

            expect(result).toBeNull();
        });

        it('should return null if password does not match', async () => {
            jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

            const result = await service.validateUser('test@example.com', 'wrongpassword');

            expect(result).toBeNull();
        });
    });

    describe('login', () => {
        it('should return access token and user info', async () => {
            const loginUser = { ...mockUser };
            delete (loginUser as any).passwordHash;

            const result = await service.login(loginUser);

            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('user');
            expect(result.user.id).toBe(mockUser.id);
            expect(result.user.email).toBe(mockUser.email);
            expect(result.user.role).toBe(mockUser.role);
            expect(jwtService.sign).toHaveBeenCalledWith({
                email: mockUser.email,
                sub: mockUser.id,
                clubId: mockUser.clubId,
                role: mockUser.role,
                globalParentId: mockUser.globalParentId,
            });
        });

        it('should handle user without globalParentId', async () => {
            const userWithoutGlobalParent = { ...mockUser, globalParentId: null };
            delete (userWithoutGlobalParent as any).passwordHash;

            await service.login(userWithoutGlobalParent);

            expect(jwtService.sign).toHaveBeenCalledWith({
                email: mockUser.email,
                sub: mockUser.id,
                clubId: mockUser.clubId,
                role: mockUser.role,
                globalParentId: undefined,
            });
        });
    });
});
