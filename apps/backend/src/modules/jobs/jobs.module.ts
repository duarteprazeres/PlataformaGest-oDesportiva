import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../../database/database.module';
import { WithdrawalProcessor } from './withdrawal.processor';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule],
  providers: [WithdrawalProcessor],
})
export class JobsModule {}
