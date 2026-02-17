import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AthletesController } from './athletes.controller';
import { AthletesService } from './athletes.service';

import { NotificationsModule } from '../notifications/notifications.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, MailModule],
  controllers: [AthletesController],
  providers: [AthletesService],
  exports: [AthletesService],
})
export class AthletesModule {}
