import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Body, Request, Get, Query, Param, Patch } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { TrainingsService } from './trainings.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

@Controller('trainings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrainingsController {
    constructor(private readonly trainingsService: TrainingsService) { }

    @Post()
    @Roles(UserRole.CLUB_ADMIN, UserRole.COACH)
    @UseInterceptors(FileInterceptor('file'))
    create(@Request() req: RequestWithUser, @Body() createTrainingDto: CreateTrainingDto, @UploadedFile() file?: Express.Multer.File) {
        return this.trainingsService.create(req.user.clubId, req.user.id, createTrainingDto, file);
    }

    @Get()
    findAll(
        @Request() req: RequestWithUser,
        @Query('teamId') teamId?: string,
        @Query('status') status?: 'upcoming' | 'pending_lock' | 'history'
    ) {
        return this.trainingsService.findAll(req.user.clubId, teamId, status);
    }

    @Get(':id')
    findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
        return this.trainingsService.findOne(req.user.clubId, id);
    }

    @Patch(':id')
    @Roles(UserRole.CLUB_ADMIN, UserRole.COACH)
    @UseInterceptors(FileInterceptor('file'))
    update(@Request() req: RequestWithUser, @Param('id') id: string, @Body() updateTrainingDto: any, @UploadedFile() file?: Express.Multer.File) {
        return this.trainingsService.update(req.user.clubId, id, updateTrainingDto, file);
    }

    @Post(':id/attendance')
    @Roles(UserRole.CLUB_ADMIN, UserRole.COACH)
    async markAttendance(
        @Request() req: RequestWithUser,
        @Param('id') trainingId: string,
        @Body() markAttendanceDto: MarkAttendanceDto
    ) {
        const clubId = req.user.clubId;
        const userId = req.user.id;
        return this.trainingsService.markAttendance(clubId, trainingId, userId, markAttendanceDto);
    }

    @Patch(':id/finalize')
    @Roles(UserRole.CLUB_ADMIN, UserRole.COACH)
    async finalizeTraining(
        @Request() req: RequestWithUser,
        @Param('id') trainingId: string
    ) {
        const clubId = req.user.clubId;
        const userId = req.user.id;
        return this.trainingsService.finalizeTraining(clubId, trainingId, userId);
    }
}
