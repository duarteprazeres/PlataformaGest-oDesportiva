import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('players')
export class PlayersController {
    constructor(private readonly playersService: PlayersService) { }

    @Post()
    create(@Request() req, @Body() createPlayerDto: CreatePlayerDto) {
        return this.playersService.create(req.user.clubId, createPlayerDto);
    }

    @Get()
    findAll(@Request() req, @Query('teamId') teamId?: string) {
        return this.playersService.findAll(req.user.clubId, teamId);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.playersService.findOne(req.user.clubId, id);
    }
}
