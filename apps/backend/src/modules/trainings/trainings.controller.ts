import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
  Get,
  Query,
  Param,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { TrainingsService } from './trainings.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { TrainingEntity } from './entities/training.entity';

@ApiTags('trainings')
@Controller('trainings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TrainingsController {
  constructor(private readonly trainingsService: TrainingsService) {}

  @Post()
  @Roles(UserRole.CLUB_ADMIN, UserRole.COACH)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a new training' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Training creation data and optional file',
    schema: {
      type: 'object',
      properties: {
        teamId: { type: 'string', format: 'uuid' },
        scheduledDate: { type: 'string', format: 'date' },
        startTime: { type: 'string' },
        endTime: { type: 'string' },
        location: { type: 'string' },
        notes: { type: 'string' },
        objectives: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Training created successfully', type: TrainingEntity })
  create(
    @Request() req: RequestWithUser,
    @Body() createTrainingDto: CreateTrainingDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.trainingsService.create(req.user.clubId, req.user.id, createTrainingDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'List trainings' })
  @ApiQuery({ name: 'teamId', required: false, description: 'Filter by team ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['upcoming', 'pending_lock', 'history'],
    description: 'Filter by status',
  })
  @ApiResponse({ status: 200, description: 'List of trainings', type: [TrainingEntity] })
  findAll(
    @Request() req: RequestWithUser,
    @Query('teamId') teamId?: string,
    @Query('status') status?: 'upcoming' | 'pending_lock' | 'history',
  ) {
    return this.trainingsService.findAll(req.user.clubId, teamId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get training by ID' })
  @ApiParam({ name: 'id', description: 'Training ID' })
  @ApiResponse({ status: 200, description: 'Training found', type: TrainingEntity })
  @ApiResponse({ status: 404, description: 'Training not found' })
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.trainingsService.findOne(req.user.clubId, id);
  }

  @Patch(':id')
  @Roles(UserRole.CLUB_ADMIN, UserRole.COACH)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Update training' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Training update data and optional file',
    schema: {
      type: 'object',
      properties: {
        // Simplified schema for update, ideally should reference UpdateTrainingDto structure
        notes: { type: 'string' },
        objectives: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Training updated successfully', type: TrainingEntity })
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateTrainingDto: UpdateTrainingDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.trainingsService.update(req.user.clubId, id, updateTrainingDto, file);
  }

  @Post(':id/attendance')
  @Roles(UserRole.CLUB_ADMIN, UserRole.COACH)
  @ApiOperation({ summary: 'Mark attendance for a training' })
  @ApiParam({ name: 'id', description: 'Training ID' })
  @ApiBody({ type: MarkAttendanceDto })
  @ApiResponse({ status: 200, description: 'Attendance marked successfully' })
  async markAttendance(
    @Request() req: RequestWithUser,
    @Param('id') trainingId: string,
    @Body() markAttendanceDto: MarkAttendanceDto,
  ) {
    const clubId = req.user.clubId;
    const userId = req.user.id;
    return this.trainingsService.markAttendance(clubId, trainingId, userId, markAttendanceDto);
  }

  @Patch(':id/finalize')
  @Roles(UserRole.CLUB_ADMIN, UserRole.COACH)
  @ApiOperation({ summary: 'Finalize training' })
  @ApiParam({ name: 'id', description: 'Training ID' })
  @ApiResponse({
    status: 200,
    description: 'Training finalized successfully',
    type: TrainingEntity,
  })
  async finalizeTraining(@Request() req: RequestWithUser, @Param('id') trainingId: string) {
    const clubId = req.user.clubId;
    const userId = req.user.id;
    return this.trainingsService.finalizeTraining(clubId, trainingId, userId);
  }
}
