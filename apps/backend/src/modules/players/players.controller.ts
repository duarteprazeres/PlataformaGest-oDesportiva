import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { AuthGuard } from '@nestjs/passport';
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
import { PlayerEntity } from './entities/player.entity';

@ApiTags('players')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new player' })
  @ApiBody({ type: CreatePlayerDto })
  @ApiResponse({ status: 201, description: 'Player created successfully', type: PlayerEntity })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Request() req: RequestWithUser, @Body() createPlayerDto: CreatePlayerDto) {
    return this.playersService.create(req.user.clubId, createPlayerDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all players' })
  @ApiQuery({ name: 'teamId', required: false, description: 'Filter by team ID' })
  @ApiResponse({ status: 200, description: 'List of players', type: [PlayerEntity] })
  findAll(@Request() req: RequestWithUser, @Query('teamId') teamId?: string) {
    return this.playersService.findAll(req.user.clubId, teamId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get player by ID' })
  @ApiParam({ name: 'id', description: 'Player ID' })
  @ApiResponse({ status: 200, description: 'Player found', type: PlayerEntity })
  @ApiResponse({ status: 404, description: 'Player not found' })
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.playersService.findOne(req.user.clubId, id);
  }
}
