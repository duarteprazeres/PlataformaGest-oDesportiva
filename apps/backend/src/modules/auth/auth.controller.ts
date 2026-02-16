import { Controller, Request, Post, UseGuards, Res, Get, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response, Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';

interface RequestWithUser extends ExpressRequest {
    user: Omit<User, 'passwordHash'>;
}

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req: RequestWithUser, @Body() _loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        // We add LoginDto for validation pipeline, but the actual user is attached by LocalStrategy
        const { access_token, user } = await this.authService.login(req.user);

        // Set HTTP-only cookie
        res.cookie('Authentication', access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in prod
            sameSite: 'strict',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        return { user, access_token };
    }

    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('Authentication');
        return { message: 'Logged out successfully' };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req: RequestWithUser) {
        return { user: req.user };
    }
}
