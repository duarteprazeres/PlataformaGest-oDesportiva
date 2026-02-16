import { Controller, Get, Post, Body, Patch, Param, Request, UseGuards, Query, ForbiddenException } from '@nestjs/common';
import { AbsenceNoticesService } from './absence-notices.service';
import { CreateAbsenceNoticeDto } from './dto/create-absence-notice.dto';
import { ApproveNoticeDto } from './dto/approve-notice.dto';
import { DismissNoticeDto } from './dto/dismiss-notice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AbsenceNoticeStatus } from '@prisma/client';

@Controller('absence-notices')
@UseGuards(JwtAuthGuard)
export class AbsenceNoticesController {
    constructor(private readonly absenceNoticesService: AbsenceNoticesService) { }

    @Post()
    create(@Request() req, @Body() dto: CreateAbsenceNoticeDto) {
        if (req.user.type !== 'GLOBAL_PARENT') {
            throw new ForbiddenException('Apenas encarregados de educação podem submeter avisos');
        }
        return this.absenceNoticesService.create(dto, req.user.userId || req.user.sub);
    }

    @Get('parent')
    findAllByParent(@Request() req) {
        if (req.user.type !== 'GLOBAL_PARENT') {
            throw new ForbiddenException('Acesso restrito a encarregados de educação');
        }
        return this.absenceNoticesService.findAllByParent(req.user.userId || req.user.sub);
    }

    @Get('club')
    findAllByClub(@Request() req, @Query('status') status?: AbsenceNoticeStatus) {
        if (!req.user.clubId) {
            throw new ForbiddenException('Acesso restrito a utilizadores de clubes');
        }
        return this.absenceNoticesService.findAllByClub(req.user.clubId, status);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.absenceNoticesService.findOne(id);
    }

    @Patch(':id/approve')
    approve(@Request() req, @Param('id') id: string, @Body() dto: ApproveNoticeDto) {
        if (!req.user.clubId) {
            throw new ForbiddenException('Apenas treinadores/admins podem aprovar avisos');
        }
        return this.absenceNoticesService.approve(id, req.user.userId, dto);
    }

    @Patch(':id/dismiss')
    dismiss(@Request() req, @Param('id') id: string, @Body() dto: DismissNoticeDto) {
        if (!req.user.clubId) {
            throw new ForbiddenException('Apenas treinadores/admins podem rejeitar avisos');
        }
        return this.absenceNoticesService.dismiss(id, req.user.userId, dto);
    }
}
