import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { CreatePlayerDto } from '../src/modules/players/dto/create-player.dto';
import { CreateTrainingDto } from '../src/modules/trainings/dto/create-training.dto';

describe('Players Flow (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let accessToken: string;
    let clubId: string;
    let userId: string; // Admin user
    let teamId: string;
    let playerId: string;
    let trainingId: string;

    const uniqueId = Date.now();
    const testClub = {
        name: `Players E2E Club ${uniqueId}`,
        subdomain: `players-e2e-${uniqueId}`,
        email: `players-e2e-${uniqueId}@test.com`,
        adminName: 'Admin',
        adminEmail: `admin-e2e-${uniqueId}@test.com`,
        adminPassword: 'password123',
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // 1. Register Club & Admin
        const registerRes = await request(app.getHttpServer())
            .post('/clubs')
            .send(testClub)
            .expect(201);

        clubId = registerRes.body.club.id;
        userId = registerRes.body.admin.id;

        // 2. Login
        const loginRes = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                email: testClub.adminEmail,
                password: testClub.adminPassword,
            })
            .expect(201);

        accessToken = loginRes.body.access_token;

        // 3. Seed Season
        const season = await prisma.season.create({
            data: {
                clubId,
                name: '2025/2026',
                startDate: new Date('2025-09-01'),
                endDate: new Date('2026-06-30'),
            },
        });

        // 4. Seed Team
        const team = await prisma.team.create({
            data: {
                clubId,
                seasonId: season.id,
                name: 'U15 A',
                category: 'U15',
                gender: 'M',
            },
        });
        teamId = team.id;
    });

    afterAll(async () => {
        // Cleanup: Club soft delete logic (Task 2) should handle cascade if we used remove(), but here we probably want hard delete or just rely on test DB reset.
        // For now, let's leave cleanup to the DB reset script or garbage collection.
        await app.close();
    });

    it('/players (POST) - Create Player in Team', async () => {
        const createDto: CreatePlayerDto = {
            firstName: 'E2E',
            lastName: 'Player',
            birthDate: '2010-05-15',
            parentId: userId, // assigning admin as parent for simplicity
            currentTeamId: teamId, // Add directly to team
        };

        const response = await request(app.getHttpServer())
            .post('/players')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(createDto)
            .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.firstName).toBe('E2E');
        expect(response.body.currentTeamId).toBe(teamId);
        playerId = response.body.id;
    });

    it('/trainings (POST) - Create Training', async () => {
        const createDto: CreateTrainingDto = {
            teamId,
            scheduledDate: '2026-03-20',
            startTime: '10:00',
            endTime: '12:00',
            location: 'Training Ground',
            notes: 'E2E Training',
            isRecurring: false,
        };

        const response = await request(app.getHttpServer())
            .post('/trainings')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(createDto)
            .expect(201);

        // response logic check based on service implementation
        // Depending on Controller return type, might be status 201 with body
        expect(response.body).toBeDefined();

        // Fetch created training
        const training = await prisma.training.findFirst({
            where: { clubId, teamId, location: 'Training Ground' },
            orderBy: { createdAt: 'desc' },
        });
        expect(training).toBeDefined();
        trainingId = training!.id;
    });

    it('/trainings/:id/attendance (POST) - Mark Attendance', async () => {
        const attendanceDto = {
            attendance: [
                {
                    playerId,
                    status: 'PRESENT',
                },
            ],
        };

        const response = await request(app.getHttpServer())
            .post(`/trainings/${trainingId}/attendance`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send(attendanceDto)
            .expect(201);

        expect(response.body.success).toBe(true);
    });

    it('/trainings/:id (GET) - Verify Attendance', async () => {
        const response = await request(app.getHttpServer())
            .get(`/trainings/${trainingId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

        expect(response.body.id).toBe(trainingId);
        expect(response.body.attendance).toHaveLength(1);
        const att = response.body.attendance[0];
        expect(att.playerId).toBe(playerId);
        expect(att.status).toBe('PRESENT');
    });
});
