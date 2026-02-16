
import { Controller, Get, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@Request() req, @Query() query) {
        return this.notificationsService.findAllByUser(req.user.userId, {
            limit: query.limit ? parseInt(query.limit) : undefined,
            offset: query.offset ? parseInt(query.offset) : undefined,
            isRead: query.isRead === 'true' ? true : query.isRead === 'false' ? false : undefined,
        });
    }

    @Get('unread-count')
    getUnreadCount(@Request() req) {
        return this.notificationsService.getUnreadCount(req.user.userId);
    }

    @Patch('mark-all-read')
    markAllAsRead(@Request() req) {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }

    @Patch(':id/read')
    markAsRead(@Request() req, @Param('id') id: string) {
        return this.notificationsService.markAsRead(id, req.user.userId);
    }
}
