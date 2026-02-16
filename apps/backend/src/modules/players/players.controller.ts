import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

@UseGuards(AuthGuard('jwt'))
@Controller('players')
export class PlayersController {
    constructor(private readonly playersService: PlayersService) { }

    @Post()
    create(@Request() req: RequestWithUser, @Body() createPlayerDto: CreatePlayerDto) {
        return this.playersService.create(req.user.clubId, createPlayerDto);
    }

    @Get()
    findAll(@Request() req: RequestWithUser, @Query('teamId') teamId?: string) {
        return this.playersService.findAll(req.user.clubId, teamId);
    }

    @Get(':id')
    findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
        return this.playersService.findOne(req.user.clubId, id);
    }
}
