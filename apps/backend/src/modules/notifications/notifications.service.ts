import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: {
        clubId: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        relatedEntityType?: string;
        relatedEntityId?: string;
        actionUrl?: string;
    }) {
        return this.prisma.notification.create({
            data: {
                ...data,
                sentVia: ['APP'],
            },
        });
    }

    async findAllByUser(userId: string, query: { limit?: number; offset?: number; isRead?: boolean }) {
        const { limit = 20, offset = 0, isRead } = query;

        const where: any = { userId };
        if (isRead !== undefined) {
            where.isRead = isRead;
        }

        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.notification.count({ where }),
        ]);

        return {
            data: notifications,
            meta: {
                total,
                page: Math.floor(offset / limit) + 1,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    async getUnreadCount(userId: string) {
        const count = await this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
        return { count };
    }

    async markAsRead(id: string, userId: string) {
        // Verify ownership
        const notification = await this.prisma.notification.findFirst({
            where: { id, userId },
        });

        if (!notification) {
            throw new Error('Notification not found or access denied');
        }

        return this.prisma.notification.update({
            where: { id },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }
}
