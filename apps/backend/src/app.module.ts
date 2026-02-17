import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { LoggerMiddleware } from './logger.middleware';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { TeamsModule } from './modules/teams/teams.module';
import { PlayersModule } from './modules/players/players.module';
import { SeasonsModule } from './modules/seasons/seasons.module';
import { GlobalAuthModule } from './modules/global-auth/global-auth.module';
import { AthletesModule } from './modules/athletes/athletes.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MatchesModule } from './modules/matches/matches.module';
import { TrainingsModule } from './modules/trainings/trainings.module';
import { InjuriesModule } from './modules/injuries/injuries.module';
import { AbsenceNoticesModule } from './modules/absence-notices/absence-notices.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MailModule } from './modules/mail/mail.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { CacheModule } from './modules/cache/cache.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('RATE_LIMIT_TTL') || 60000,
          limit: config.get('RATE_LIMIT_MAX') || 100,
        },
      ],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ClubsModule,
    PaymentsModule,
    TeamsModule,
    PlayersModule,
    SeasonsModule,
    GlobalAuthModule,
    AthletesModule,
    JobsModule,
    MatchesModule,
    TrainingsModule,
    InjuriesModule,
    AbsenceNoticesModule,
    NotificationsModule,
    MailModule,
    HealthModule,
    MetricsModule,
    CacheModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
