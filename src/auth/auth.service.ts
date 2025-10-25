import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs'; // ✅ aligne avec le seed
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async validateUser(email: string, password: string) {
    const normalized = (email || '').trim().toLowerCase(); // ✅ email normalisé
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });

    // messages volontairement génériques
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  signPayload(user: { id: string; email: string; role: Role }) {
    return this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const access_token = this.signPayload(user);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: (user as any).firstName,
      },
    };
  }

  async adminCreateUser(
    adminId: string,
    data: { email: string; password: string; role: Role; firstName?: string; lastName?: string },
  ) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== Role.ADMIN) throw new ForbiddenException('Only admin');

    const normalized = (data.email || '').trim().toLowerCase();
    const hash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: normalized,
        passwordHash: hash,
        role: data.role,
        isActive: true,
        firstName: data.firstName ?? 'User',
        lastName: data.lastName ?? null,
      },
      select: { id: true, email: true, role: true, firstName: true, lastName: true },
    });
  }
}
