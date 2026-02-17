import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GlobalAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: { email: string; password: string; firstName: string; lastName: string }) {
    // Check if email exists
    const existing = await this.prisma.globalParent.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const parent = await this.prisma.globalParent.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    return this.generateToken(parent);
  }

  async login(data: { email: string; password: string }) {
    const parent = await this.prisma.globalParent.findUnique({
      where: { email: data.email },
    });

    if (!parent || !(await bcrypt.compare(data.password, parent.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(parent);
  }

  private generateToken(parent: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }) {
    const payload = {
      sub: parent.id,
      email: parent.email,
      firstName: parent.firstName,
      lastName: parent.lastName,
      type: 'GLOBAL_PARENT',
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: parent.id,
        email: parent.email,
        firstName: parent.firstName,
        lastName: parent.lastName,
      },
    };
  }
}
