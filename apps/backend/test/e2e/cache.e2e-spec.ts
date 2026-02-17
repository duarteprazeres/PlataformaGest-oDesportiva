import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { ClubsService } from '../../src/modules/clubs/clubs.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

describe('Cache Integration (e2e)', () => {
  let app: INestApplication;
  let clubsService: ClubsService;
  let cacheManager: Cache;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    clubsService = moduleFixture.get<ClubsService>(ClubsService);
    cacheManager = moduleFixture.get<Cache>(CACHE_MANAGER);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should cache club by subdomain', async () => {
    const subdomain = 'sporting';
    const cacheKey = `club:subdomain:${subdomain}`;

    // Ensure cache is empty
    await cacheManager.del(cacheKey);

    // 1st Call - Should hit DB and set cache
    // const start1 = Date.now();
    const club1 = await clubsService.findBySubdomain(subdomain);
    // const duration1 = Date.now() - start1;

    expect(club1).toBeDefined();
    expect(club1.subdomain).toBe(subdomain);

    // Verify cache is set
    const cachedClub = await cacheManager.get(cacheKey);
    expect(cachedClub).toBeDefined();
    expect((cachedClub as { id: string }).id).toBe(club1.id);

    // 2nd Call - Should hit Cache
    // const start2 = Date.now();
    const club2 = await clubsService.findBySubdomain(subdomain);
    // const duration2 = Date.now() - start2;

    expect(club2.id).toBe(club1.id);
    // console.log(`1st Call: ${duration1}ms, 2nd Call: ${duration2}ms`);

    // Note: In a local env with fast DB, duration diff might be small,
    // but the existence of the key in cache proves it works.
  });
});
