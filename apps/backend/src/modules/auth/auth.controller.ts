import { Controller, Request, Post, UseGuards, Res, Get, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response, Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserEntity } from '../users/entities/user.entity';

interface RequestWithUser extends ExpressRequest {
  user: Omit<User, 'passwordHash'>;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Login to the application' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Return user and access token', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Request() req: RequestWithUser,
    @Body() _loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // We add LoginDto for validation pipeline, but the actual user is attached by LocalStrategy
    const { access_token, user } = await this.authService.login(req.user);

    // Set HTTP-only cookie
    res.cookie('Authentication', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in prod
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return { user, access_token };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout from the application' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('Authentication');
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return current user profile', type: UserEntity })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req: RequestWithUser) {
    return { user: req.user };
  }
}
