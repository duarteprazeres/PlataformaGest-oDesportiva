import { Module } from '@nestjs/common';
import { AbsenceNoticesService } from './absence-notices.service';
import { AbsenceNoticesController } from './absence-notices.controller';
import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [DatabaseModule, NotificationsModule],
    controllers: [AbsenceNoticesController],
    providers: [AbsenceNoticesService],
    exports: [AbsenceNoticesService],
})
export class AbsenceNoticesModule { }
