import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { SeasonsService } from './seasons.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

@Controller('seasons')
@UseGuards(JwtAuthGuard)
export class SeasonsController {
    constructor(private readonly seasonsService: SeasonsService) { }

    @Post()
    create(@Request() req: RequestWithUser, @Body() createSeasonDto: CreateSeasonDto) {
        return this.seasonsService.create(req.user.clubId, createSeasonDto);
    }

    @Get()
    findAll(@Request() req: RequestWithUser) {
        return this.seasonsService.findAll(req.user.clubId);
    }

    @Get('active')
    findActive(@Request() req: RequestWithUser) {
        return this.seasonsService.findActive(req.user.clubId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.seasonsService.findOne(id);
    }

    @Patch(':id/toggle-active')
    toggleActive(@Param('id') id: string) {
        return this.seasonsService.toggleActive(id);
    }
}
