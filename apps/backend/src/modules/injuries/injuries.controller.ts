import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, Query } from '@nestjs/common';
import { InjuriesService } from './injuries.service';
import { CreateInjuryDto } from './dto/create-injury.dto';
import { UpdateInjuryDto } from './dto/update-injury.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('injuries')
@UseGuards(JwtAuthGuard)
export class InjuriesController {
    constructor(private readonly injuriesService: InjuriesService) { }

    @Post()
    create(@Request() req, @Body() createInjuryDto: CreateInjuryDto) {
        return this.injuriesService.create(req.user.clubId, req.user.userId, createInjuryDto);
    }

    @Get()
    findAll(@Request() req, @Query('activeOnly') activeOnly?: string, @Query('playerId') playerId?: string) {
        return this.injuriesService.findAll(req.user.clubId, activeOnly === 'true', playerId);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.injuriesService.findOne(req.user.clubId, id);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateInjuryDto: UpdateInjuryDto) {
        return this.injuriesService.update(req.user.clubId, id, updateInjuryDto);
    }
}
