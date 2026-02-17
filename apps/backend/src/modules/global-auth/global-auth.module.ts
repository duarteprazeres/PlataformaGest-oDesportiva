import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module';
import { GlobalAuthController } from './global-auth.controller';
import { GlobalAuthService } from './global-auth.service';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_jwt_key', // Should match main auth secret or be separate
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [GlobalAuthController],
  providers: [GlobalAuthService],
  exports: [GlobalAuthService],
})
export class GlobalAuthModule {}
