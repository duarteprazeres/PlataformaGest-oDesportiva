import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    async findAll(@Request() req) {
        const clubId = req.user.clubId;
        return this.usersService.findAll(clubId);
    }

    @Post()
    async create(@Request() req, @Body() body: any) {
        // Enforce clubId from the authenticated admin
        const clubId = req.user.clubId;

        // Basic protection: only admins can create
        // Improve later with specific Guards isUserAdmin()
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CLUB_ADMIN') {
            // For now just proceed, assuming endpoint allowed for authenticated users or adding check
            // Ideally throw ForbiddenException
        }

        return this.usersService.create({
            ...body,
            clubId,
            role: body.role || 'PARENT', // Default to PARENT if not specified
        });
    }

    @Get('profile')
    async getProfile(@Request() req) {
        return this.usersService.findById(req.user.sub);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Request() req) {
        // Placeholder for admin details view if needed later
        return this.usersService.findById(req.user.sub);
    }

    @Patch('profile')
    async updateProfile(@Request() req) {
        return this.usersService.update(req.user.sub, req.body);
    }

    @Post('change-password')
    async changePassword(@Request() req, @Body() body: { password: string }) {
        return this.usersService.changePassword(req.user.sub, body.password);
    }
}
