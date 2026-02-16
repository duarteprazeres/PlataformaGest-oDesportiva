import { Module } from '@nestjs/common';
import { InjuriesService } from './injuries.service';
import { InjuriesController } from './injuries.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [InjuriesController],
    providers: [InjuriesService],
})
export class InjuriesModule { }
