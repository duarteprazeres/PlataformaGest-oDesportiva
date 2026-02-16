import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { UpdateCallupStatsDto } from './dto/update-callup-stats.dto';
import { FinalizeMatchDto } from './dto/finalize-match.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
    constructor(private matchesService: MatchesService) { }

    @Post()
    createMatch(@Request() req: RequestWithUser, @Body() dto: CreateMatchDto) {
        return this.matchesService.createMatch(req.user.clubId, dto);
    }

    @Get('team/:teamId')
    getMatchesByTeam(@Request() req: RequestWithUser, @Param('teamId') teamId: string) {
        return this.matchesService.findAllByTeam(req.user.clubId, teamId);
    }

    @Get(':id')
    getMatch(@Request() req: RequestWithUser, @Param('id') id: string) {
        return this.matchesService.findOne(req.user.clubId, id);
    }

    @Patch(':id')
    updateMatch(@Request() req: RequestWithUser, @Param('id') id: string, @Body() dto: UpdateMatchDto) {
        return this.matchesService.updateMatch(req.user.clubId, id, dto);
    }

    @Delete(':id')
    deleteMatch(@Request() req: RequestWithUser, @Param('id') id: string) {
        return this.matchesService.deleteMatch(req.user.clubId, id);
    }

    // === CALLUPS ===

    @Post(':id/callups/:playerId')
    addCallup(@Request() req: RequestWithUser, @Param('id') matchId: string, @Param('playerId') playerId: string) {
        return this.matchesService.addCallup(req.user.clubId, matchId, playerId);
    }

    @Get(':id/callups')
    getCallups(@Request() req: RequestWithUser, @Param('id') matchId: string) {
        return this.matchesService.getCallups(req.user.clubId, matchId);
    }

    @Post(':id/callups/:playerId/confirm')
    confirmCallup(@Request() req: RequestWithUser, @Param('id') matchId: string, @Param('playerId') playerId: string) {
        return this.matchesService.confirmCallup(req.user.clubId, matchId, playerId);
    }

    @Patch(':id/callups/:playerId/stats')
    updateCallupStats(
        @Request() req: RequestWithUser,
        @Param('id') matchId: string,
        @Param('playerId') playerId: string,
        @Body() dto: UpdateCallupStatsDto,
    ) {
        return this.matchesService.updateCallupStats(req.user.clubId, matchId, playerId, dto);
    }

    @Post(':id/finalize')
    finalizeMatch(@Request() req: RequestWithUser, @Param('id') matchId: string, @Body() dto: FinalizeMatchDto) {
        return this.matchesService.finalizeMatch(req.user.clubId, matchId, dto);
    }
}
