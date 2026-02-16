import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { GlobalAuthService } from './global-auth.service';

@Controller('auth/global')
export class GlobalAuthController {
    constructor(private readonly authService: GlobalAuthService) { }

    @Post('register')
    async register(@Body() body: { email: string; password: string; firstName: string; lastName: string }) {
        return this.authService.register(body);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body);
    }
}
