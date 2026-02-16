import { Controller, Request, Post, UseGuards, Res, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @UseGuards(AuthGuard('local'))
    @Post('login')
    async login(@Request() req, @Res({ passthrough: true }) res: Response) {
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
    getProfile(@Request() req) {
        return { user: req.user };
    }
}
