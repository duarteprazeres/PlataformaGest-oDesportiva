import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module'; // Depend on UsersModule
import { LocalStrategy } from './local.strategy';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'super_secret_jwt_key',
                signOptions: { expiresIn: '1d' },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }
