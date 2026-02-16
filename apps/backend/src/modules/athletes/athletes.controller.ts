import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AthletesService } from './athletes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreatePassportDto } from './dto/create-passport.dto';
import { SearchAthleteDto } from './dto/search-athlete.dto';
import { TerminateLinkDto } from './dto/terminate-link.dto';
import { TransferRequestDto } from './dto/transfer-request.dto';
import { multerOptions } from '../../common/storage/storage.config';

@Controller('athletes')
@UseGuards(JwtAuthGuard)
export class AthletesController {
    constructor(private readonly athletesService: AthletesService) { }

    @Post('passport')
    @Roles(UserRole.PARENT)
    @UseGuards(RolesGuard)
    async createPassport(@Request() req, @Body() body: CreatePassportDto) {
        return this.athletesService.createPassport(req.user.globalParentId, body);
    }

    @Get('search')
    async search(@Query() query: SearchAthleteDto) {
        return this.athletesService.searchForLink(query);
    }

    @Get('my-athletes')
    @Roles(UserRole.PARENT)
    @UseGuards(RolesGuard)
    async getMyAthletes(@Request() req) {
        return this.athletesService.findAllByParent(req.user.globalParentId);
    }

    @Post('request-transfer')
    @Roles(UserRole.CLUB_ADMIN)
    @UseGuards(RolesGuard)
    async requestTransfer(@Request() req, @Body() body: TransferRequestDto) {
        return this.athletesService.requestTransfer(req.user.clubId, body.publicId);
    }

    @Patch('transfer-requests/:id/approve')
    @Roles(UserRole.PARENT)
    @UseGuards(RolesGuard)
    async approveTransfer(@Request() req, @Param('id') requestId: string) {
        return this.athletesService.approveTransfer(req.user.globalParentId, requestId);
    }

    @Get(':id/history')
    @UseGuards(JwtAuthGuard)
    async getHistory(@Param('id') id: string) {
        return this.athletesService.getAthleteHistory(id);
    }

    @Get(':id/current-club')
    async getCurrentClub(@Param('id') id: string) {
        return this.athletesService.getCurrentClub(id);
    }

    @Get(':id/stats')
    async getStats(@Param('id') id: string) {
        return this.athletesService.getAthleteStats(id);
    }

    @Get(':id/upcoming-trainings')
    async getUpcomingTrainings(@Param('id') id: string) {
        return this.athletesService.getUpcomingTrainings(id);
    }

    @Post(':id/request-withdrawal')
    @Roles(UserRole.PARENT)
    @UseGuards(RolesGuard)
    async requestWithdrawal(@Request() req, @Param('id') id: string) {
        return this.athletesService.requestWithdrawal(req.user.globalParentId, id);
    }

    @Post(':id/cancel-withdrawal')
    @Roles(UserRole.PARENT)
    @UseGuards(RolesGuard)
    async cancelWithdrawal(@Request() req, @Param('id') id: string) {
        return this.athletesService.cancelWithdrawal(req.user.globalParentId, id);
    }

    @Post('player/:playerId/terminate')
    @Roles(UserRole.CLUB_ADMIN)
    @UseGuards(RolesGuard)
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'withdrawalLetter', maxCount: 1 },
        { name: 'medicalCertificate', maxCount: 1 },
    ], multerOptions))
    async terminateLink(
        @Request() req,
        @Param('playerId') playerId: string,
        @Body() body: TerminateLinkDto,
        @UploadedFiles() files: { withdrawalLetter?: Express.Multer.File[], medicalCertificate?: Express.Multer.File[] }
    ) {
        // If files are uploaded, update DTO with file paths
        if (files?.withdrawalLetter?.[0]) {
            body.withdrawalLetterUrl = `/uploads/${files.withdrawalLetter[0].filename}`;
        }

        return this.athletesService.terminateLink(req.user.clubId, playerId, body);
    }
}
