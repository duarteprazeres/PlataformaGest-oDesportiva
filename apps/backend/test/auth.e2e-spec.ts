import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const uniqueId = Date.now();
  const testClub = {
    name: `Test Club ${uniqueId}`,
    subdomain: `test-club-${uniqueId}`,
    email: `club-${uniqueId}@test.com`,
    adminName: 'Test Admin',
    adminEmail: `admin-${uniqueId}@test.com`,
    adminPassword: 'password123',
  };

  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/clubs (POST) - Register Club', async () => {
    const response = await request(app.getHttpServer()).post('/clubs').send(testClub).expect(201);

    expect(response.body).toHaveProperty('club');
    expect(response.body).toHaveProperty('admin');
    expect(response.body.club.subdomain).toBe(testClub.subdomain);
    expect(response.body.admin.email).toBe(testClub.adminEmail);
  });

  it('/auth/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testClub.adminEmail,
        password: testClub.adminPassword,
      })
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body).toHaveProperty('user');
    accessToken = response.body.access_token;
  });

  it('/auth/me (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe(testClub.adminEmail);
  });
});
