import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('PaymentsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let clubId: string;
  let userId: string; // The admin user (payer)
  let playerId: string;

  const uniqueId = Date.now();
  const testClub = {
    name: `Payment Test Club ${uniqueId}`,
    subdomain: `pay-club-${uniqueId}`,
    email: `payclub-${uniqueId}@test.com`,
    adminName: 'Pay Admin',
    adminEmail: `payadmin-${uniqueId}@test.com`,
    adminPassword: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);
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

    // 3. Seed Player (Direct DB access needed as Players API might not be implemented/accessible or we want to focus on Payments)
    // We need to create a player associated with this club.
    const player = await prisma.player.create({
      data: {
        firstName: 'Test',
        lastName: 'Player',
        birthDate: new Date('2010-01-01'),
        // Using the admin user as parent for simplicity in this test
        parentId: userId,
        clubId: clubId,
      },
    });
    playerId = player.id;
  });

  afterAll(async () => {
    // Cleanup: Delete club cascades to everything usually.
    // await prisma.club.delete({ where: { id: clubId } });
    await app.close();
  });

  let paymentId: string;

  it('/payments (POST) - Create Payment', async () => {
    const createDto = {
      playerId: playerId,
      payerId: userId, // The admin is paying for now (or self)
      amount: 100.0,
      paymentType: 'MONTHLY_FEE',
      dueDate: new Date().toISOString(),
      paymentMethod: 'MBWAY',
    };

    const response = await request(app.getHttpServer())
      .post('/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createDto)
      .expect(201); // Created

    expect(response.body).toHaveProperty('id');
    expect(response.body.amount).toBe('100'); // Decimal often returned as string
    expect(response.body.status).toBe('PENDING');
    paymentId = response.body.id;
  });

  it('/payments (GET) - List Payments', async () => {
    const response = await request(app.getHttpServer())
      .get('/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    const payment = (response.body as Array<{ id: string }>).find(
      (p: { id: string }) => p.id === paymentId,
    );
    expect(payment).toBeDefined();
  });

  it('/payments/:id (PATCH) - Update Status to PAID', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/payments/${paymentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'PAID' })
      .expect(200);

    expect(response.body.status).toBe('PAID');
    expect(response.body.paidAt).toBeDefined();
  });
});
