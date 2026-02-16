import { Module } from '@nestjs/common';
import { SeasonsService } from './seasons.service';
import { SeasonsController } from './seasons.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [SeasonsController],
    providers: [SeasonsService],
    exports: [SeasonsService],
})
export class SeasonsModule { }
