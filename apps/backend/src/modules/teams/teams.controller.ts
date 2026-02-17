import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { TeamEntity } from './entities/team.entity';

@ApiTags('teams')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @Roles(UserRole.CLUB_ADMIN)
  @ApiOperation({ summary: 'Create a new team' })
  @ApiBody({ type: CreateTeamDto })
  @ApiResponse({ status: 201, description: 'Team created successfully', type: TeamEntity })
  @ApiResponse({ status: 403, description: 'Forbidden - Club Admin only' })
  create(@Request() req: RequestWithUser, @Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(req.user.clubId, createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all teams' })
  @ApiQuery({ name: 'seasonId', required: false, description: 'Filter by season ID' })
  @ApiResponse({ status: 200, description: 'List of teams', type: [TeamEntity] })
  findAll(@Request() req: RequestWithUser, @Query('seasonId') seasonId?: string) {
    return this.teamsService.findAll(req.user.clubId, seasonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  @ApiParam({ name: 'id', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team found', type: TeamEntity })
  @ApiResponse({ status: 404, description: 'Team not found' })
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.teamsService.findOne(req.user.clubId, id);
  }
}
