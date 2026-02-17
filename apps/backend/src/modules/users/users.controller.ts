import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Request,
  ForbiddenException,
  Param,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { Request as ExpressRequest } from 'express';
import { User, UserRole } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserEntity } from './entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';

interface RequestWithUser extends ExpressRequest {
  user: Omit<User, 'passwordHash'>;
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users in the club' })
  @ApiResponse({ status: 200, description: 'Return list of users', type: [UserEntity] })
  async findAll(@Request() req: RequestWithUser) {
    const clubId = req.user.clubId;
    return this.usersService.findAll(clubId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserEntity })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return current user profile', type: UserEntity })
  async getProfile(@Request() req: RequestWithUser) {
    return this.usersService.findById(req.user.id);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Return user details', type: UserEntity })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Request() req: RequestWithUser, @Param('id') _id: string) {
    // Placeholder for admin details view if needed later
    // Using req.user.id instead of sub for consistency if standardized
    return this.usersService.findById(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UserEntity })
  async updateProfile(@Request() req: RequestWithUser, @Body() body: UpdateUserDto) {
    return this.usersService.update(req.user.id, body);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changePassword(@Request() req: RequestWithUser, @Body() body: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, body.password);
  }
}
