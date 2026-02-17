import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateClubDto } from './dto/create-club.dto';
import { ClubEntity } from './entities/club.entity';

@ApiTags('clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) { }

  @Get('by-subdomain/:subdomain')
  @ApiOperation({ summary: 'Find club by subdomain' })
  @ApiParam({ name: 'subdomain', description: 'The subdomain to search for' })
  @ApiResponse({ status: 200, description: 'Return the club details', type: ClubEntity })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async findBySubdomain(@Param('subdomain') subdomain: string) {
    return this.clubsService.findBySubdomain(subdomain);
  }

  // TODO: Add AuthGuard and Role Guard (Super Admin only)
  @Post()
  @ApiOperation({ summary: 'Create a new club' })
  @ApiBody({ type: CreateClubDto })
  @ApiResponse({ status: 201, description: 'Club created successfully', type: ClubEntity })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createClubDto: CreateClubDto) {
    return this.clubsService.create(createClubDto);
  }

  // TODO: Secure this endpoint with appropriate guards
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post(':id/subscription')
  @ApiOperation({ summary: 'Update club subscription plan' })
  @ApiParam({ name: 'id', description: 'Club ID' })
  @ApiBody({ schema: { type: 'object', properties: { plan: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully', type: ClubEntity })
  @ApiResponse({ status: 400, description: 'Invalid plan or limits exceeded' })
  async updateSubscription(@Param('id') id: string, @Body('plan') plan: string) {
    return this.clubsService.updateSubscription(id, plan);
  }
}
