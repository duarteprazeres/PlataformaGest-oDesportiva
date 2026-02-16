import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) { }

    @Post()
    @Roles(UserRole.CLUB_ADMIN)
    create(@Request() req: RequestWithUser, @Body() createTeamDto: CreateTeamDto) {
        return this.teamsService.create(req.user.clubId, createTeamDto);
    }

    @Get()
    findAll(@Request() req: RequestWithUser, @Query('seasonId') seasonId?: string) {
        return this.teamsService.findAll(req.user.clubId, seasonId);
    }

    @Get(':id')
    findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
        return this.teamsService.findOne(req.user.clubId, id);
    }
}
