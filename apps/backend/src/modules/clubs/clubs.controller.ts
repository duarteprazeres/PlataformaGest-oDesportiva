import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ClubsService } from './clubs.service';

@Controller('clubs')
export class ClubsController {
    constructor(private readonly clubsService: ClubsService) { }

    @Get('by-subdomain/:subdomain')
    async findBySubdomain(@Param('subdomain') subdomain: string) {
        return this.clubsService.findBySubdomain(subdomain);
    }

    // TODO: Add AuthGuard and Role Guard (Super Admin only)
    @Post()
    async create(@Body() createClubDto: {
        name: string;
        subdomain: string;
        email: string;
        adminName: string;
        adminEmail: string;
        adminPassword: string;
    }) {
        return this.clubsService.create(createClubDto);
    }
}
