import { Controller, Get, Post, Body, Patch, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { Request as ExpressRequest } from 'express';
import { User, UserRole } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

interface RequestWithUser extends ExpressRequest {
    user: Omit<User, 'passwordHash'>;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    async findAll(@Request() req: RequestWithUser) {
        const clubId = req.user.clubId;
        return this.usersService.findAll(clubId);
    }

    @Post()
    async create(@Request() req: RequestWithUser, @Body() body: CreateUserDto) {
        // Enforce clubId from the authenticated admin
        const clubId = req.user.clubId;

        // Basic protection: only admins can create
        if (req.user.role !== UserRole.SUPER_ADMIN && req.user.role !== UserRole.CLUB_ADMIN) {
            throw new ForbiddenException('Only admins can create users');
        }

        return this.usersService.create({
            ...body,
            clubId,
            role: body.role || UserRole.PARENT,
        });
    }

    @Get('profile')
    async getProfile(@Request() req: RequestWithUser) {
        return this.usersService.findById(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Request() req: RequestWithUser) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // Placeholder for admin details view if needed later
        // Using req.user.id instead of sub for consistency if standardized
        return this.usersService.findById(req.user.id);
    }

    @Patch('profile')
    async updateProfile(@Request() req: RequestWithUser, @Body() body: UpdateUserDto) {
        return this.usersService.update(req.user.id, body);
    }

    @Post('change-password')
    async changePassword(@Request() req: RequestWithUser, @Body() body: { password: string }) {
        return this.usersService.changePassword(req.user.id, body.password);
    }
}
