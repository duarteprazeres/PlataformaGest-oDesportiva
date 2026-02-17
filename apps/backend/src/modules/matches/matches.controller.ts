import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UpdateCallupStatsDto } from './dto/update-callup-stats.dto';
import { FinalizeMatchDto } from './dto/finalize-match.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MatchEntity } from './entities/match.entity';

@ApiTags('matches')
@Controller('matches')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new match' })
  @ApiBody({ type: CreateMatchDto })
  @ApiResponse({ status: 201, description: 'Match created successfully', type: MatchEntity })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  createMatch(@Request() req: RequestWithUser, @Body() dto: CreateMatchDto) {
    return this.matchesService.createMatch(req.user.clubId, dto);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Get matches by team' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'List of matches', type: [MatchEntity] })
  getMatchesByTeam(@Request() req: RequestWithUser, @Param('teamId') teamId: string) {
    return this.matchesService.findAllByTeam(req.user.clubId, teamId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by ID' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Match found', type: MatchEntity })
  @ApiResponse({ status: 404, description: 'Match not found' })
  getMatch(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.matchesService.findOne(req.user.clubId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update match' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiBody({ type: UpdateMatchDto })
  @ApiResponse({ status: 200, description: 'Match updated successfully', type: MatchEntity })
  updateMatch(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateMatchDto,
  ) {
    return this.matchesService.updateMatch(req.user.clubId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete match' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'Match deleted successfully' })
  deleteMatch(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.matchesService.deleteMatch(req.user.clubId, id);
  }

  // === CALLUPS ===

  @Post(':id/callups/:playerId')
  @ApiOperation({ summary: 'Add player to match callup' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({ status: 201, description: 'Player added to callup' })
  addCallup(
    @Request() req: RequestWithUser,
    @Param('id') matchId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.matchesService.addCallup(req.user.clubId, matchId, playerId);
  }

  @Get(':id/callups')
  @ApiOperation({ summary: 'Get match callups' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiResponse({ status: 200, description: 'List of called up players' })
  getCallups(@Request() req: RequestWithUser, @Param('id') matchId: string) {
    return this.matchesService.getCallups(req.user.clubId, matchId);
  }

  @Post(':id/callups/:playerId/confirm')
  @ApiOperation({ summary: 'Confirm player attendance for match' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({ status: 200, description: 'Callup confirmed' })
  confirmCallup(
    @Request() req: RequestWithUser,
    @Param('id') matchId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.matchesService.confirmCallup(req.user.clubId, matchId, playerId);
  }

  @Patch(':id/callups/:playerId/stats')
  @ApiOperation({ summary: 'Update player match stats' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiBody({ type: UpdateCallupStatsDto })
  @ApiResponse({ status: 200, description: 'Stats updated successfully' })
  updateCallupStats(
    @Request() req: RequestWithUser,
    @Param('id') matchId: string,
    @Param('playerId') playerId: string,
    @Body() dto: UpdateCallupStatsDto,
  ) {
    return this.matchesService.updateCallupStats(req.user.clubId, matchId, playerId, dto);
  }

  @Post(':id/finalize')
  @ApiOperation({ summary: 'Finalize match' })
  @ApiParam({ name: 'id', description: 'Match ID' })
  @ApiBody({ type: FinalizeMatchDto })
  @ApiResponse({ status: 200, description: 'Match finalized successfully', type: MatchEntity })
  finalizeMatch(
    @Request() req: RequestWithUser,
    @Param('id') matchId: string,
    @Body() dto: FinalizeMatchDto,
  ) {
    return this.matchesService.finalizeMatch(req.user.clubId, matchId, dto);
  }
}
