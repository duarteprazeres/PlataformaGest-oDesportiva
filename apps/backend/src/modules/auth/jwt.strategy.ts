import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from './dto/jwt-payload.interface';

import { UsersService } from '../users/users.service';

import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['Authentication'];
          }
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // 1) Se for token de PAI GLOBAL, não uses usersService
    if ((payload as any).type === 'GLOBAL_PARENT') {
      return {
        id: payload.sub,                 // id do globalParent
        email: payload.email,
        role: UserRole.PARENT,           // mapeia para o enum do Prisma
        clubId: null,
        globalParentId: payload.sub,     // chave usada no controller
      };
    }

    // 2) Fluxo actual para utilizadores de clube
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: payload.sub,
      email: payload.email,
      clubId: payload.clubId,
      role: payload.role,
      globalParentId: payload.globalParentId,
    };
  }
}
