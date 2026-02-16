import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        AuthModule,
        UsersModule,
        ClubsModule,
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
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', '..', 'uploads'),
            serveRoot: '/uploads',
        }),
    ],
    controllers: [],
    providers: [],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(LoggerMiddleware)
            .forRoutes('*');
    }
}
