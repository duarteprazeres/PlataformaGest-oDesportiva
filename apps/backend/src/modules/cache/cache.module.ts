import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        if (redisUrl) {
          return {
            store: redisStore,
            url: redisUrl,
            ttl: configService.get('REDIS_TTL', 300),
            max: 1000,
          };
        }
        return {
          store: redisStore,
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          ttl: configService.get('REDIS_TTL', 300), // 5 minutes default
          max: 1000, // Max items in cache
        };
      },
      isGlobal: true,
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule { }
