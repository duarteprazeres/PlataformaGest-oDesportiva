import {
  Controller, Get, Post, Patch, Body, Param,
  UseGuards, Request, Query, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { AuthGuard } from '@nestjs/passport';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBody,
  ApiBearerAuth, ApiQuery, ApiParam, ApiConsumes,
} from '@nestjs/swagger';
import { PlayerEntity } from './entities/player.entity';

@ApiTags('players')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new player' })
  @ApiBody({ type: CreatePlayerDto })
  @ApiResponse({ status: 201, type: PlayerEntity })
  create(@Request() req: RequestWithUser, @Body() dto: CreatePlayerDto) {
    return this.playersService.create(req.user.clubId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all players' })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiResponse({ status: 200, type: [PlayerEntity] })
  findAll(@Request() req: RequestWithUser, @Query('teamId') teamId?: string) {
    return this.playersService.findAll(req.user.clubId, teamId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get player by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: PlayerEntity })
  @ApiResponse({ status: 404 })
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.playersService.findOne(req.user.clubId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update player number, team or status' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdatePlayerDto })
  @ApiResponse({ status: 200, type: PlayerEntity })
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlayerDto,
  ) {
    return this.playersService.update(req.user.clubId, id, dto);
  }

  @Post(':id/photo')
  @ApiOperation({ summary: 'Upload player photo' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id' })
  @UseInterceptors(FileInterceptor('photo', { storage: memoryStorage() }))
  uploadPhoto(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.playersService.uploadPhoto(req.user.clubId, id, file.buffer, file.mimetype);
  }
}
