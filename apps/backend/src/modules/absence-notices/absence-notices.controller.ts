import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Request,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { AbsenceNoticesService } from './absence-notices.service';
import { CreateAbsenceNoticeDto } from './dto/create-absence-notice.dto';
import { ApproveNoticeDto } from './dto/approve-notice.dto';
import { DismissNoticeDto } from './dto/dismiss-notice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AbsenceNoticeStatus } from '@prisma/client';
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
import { AbsenceNoticeEntity } from './entities/absence-notice.entity';

@ApiTags('absence-notices')
@Controller('absence-notices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AbsenceNoticesController {
  constructor(private readonly absenceNoticesService: AbsenceNoticesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new absence notice' })
  @ApiBody({ type: CreateAbsenceNoticeDto })
  @ApiResponse({
    status: 201,
    description: 'Absence notice created successfully',
    type: AbsenceNoticeEntity,
  })
  @ApiResponse({ status: 403, description: 'Forbidden (Only Parents)' })
  create(@Request() req: RequestWithUser, @Body() dto: CreateAbsenceNoticeDto) {
    if (req.user.role !== 'PARENT') {
      throw new ForbiddenException('Apenas encarregados de educação podem submeter avisos');
    }
    return this.absenceNoticesService.create(dto, req.user.id);
  }

  @Get('parent')
  @ApiOperation({ summary: 'Get absence notices submitted by parent' })
  @ApiResponse({ status: 200, description: 'List of notices', type: [AbsenceNoticeEntity] })
  @ApiResponse({ status: 403, description: 'Forbidden (Only Parents)' })
  findAllByParent(@Request() req: RequestWithUser) {
    if (req.user.role !== 'PARENT') {
      throw new ForbiddenException('Acesso restrito a encarregados de educação');
    }
    return this.absenceNoticesService.findAllByParent(req.user.id);
  }

  @Get('club')
  @ApiOperation({ summary: 'Get absence notices for club' })
  @ApiQuery({ name: 'status', required: false, enum: AbsenceNoticeStatus })
  @ApiResponse({ status: 200, description: 'List of notices', type: [AbsenceNoticeEntity] })
  @ApiResponse({ status: 403, description: 'Forbidden (Only Club Admin/Coach)' })
  findAllByClub(@Request() req: RequestWithUser, @Query('status') status?: AbsenceNoticeStatus) {
    if (!req.user.clubId) {
      throw new ForbiddenException('Acesso restrito a utilizadores de clubes');
    }
    return this.absenceNoticesService.findAllByClub(req.user.clubId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get absence notice by ID' })
  @ApiParam({ name: 'id', description: 'Notice ID' })
  @ApiResponse({ status: 200, description: 'Notice found', type: AbsenceNoticeEntity })
  @ApiResponse({ status: 404, description: 'Notice not found' })
  findOne(@Param('id') id: string) {
    return this.absenceNoticesService.findOne(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve absence notice' })
  @ApiParam({ name: 'id', description: 'Notice ID' })
  @ApiBody({ type: ApproveNoticeDto })
  @ApiResponse({ status: 200, description: 'Notice approved', type: AbsenceNoticeEntity })
  @ApiResponse({ status: 403, description: 'Forbidden (Only Club Admin/Coach)' })
  approve(@Request() req: RequestWithUser, @Param('id') id: string, @Body() dto: ApproveNoticeDto) {
    if (!req.user.clubId) {
      throw new ForbiddenException('Apenas treinadores/admins podem aprovar avisos');
    }
    return this.absenceNoticesService.approve(id, req.user.id, dto);
  }

  @Patch(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss absence notice' })
  @ApiParam({ name: 'id', description: 'Notice ID' })
  @ApiBody({ type: DismissNoticeDto })
  @ApiResponse({ status: 200, description: 'Notice dismissed', type: AbsenceNoticeEntity })
  @ApiResponse({ status: 403, description: 'Forbidden (Only Club Admin/Coach)' })
  dismiss(@Request() req: RequestWithUser, @Param('id') id: string, @Body() dto: DismissNoticeDto) {
    if (!req.user.clubId) {
      throw new ForbiddenException('Apenas treinadores/admins podem rejeitar avisos');
    }
    return this.absenceNoticesService.dismiss(id, req.user.id, dto);
  }
}
