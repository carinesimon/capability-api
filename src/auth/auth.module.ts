import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy'; // garde ton chemin existant
import { PrismaModule } from '../prisma/prisma.module';

// Coercion: "3600" -> 3600 (seconds), "1h"/"30m"/"7d" -> string accepté par jsonwebtoken
function coerceJwtExpires(value?: string): number | (string & {}) {
  const v = (value ?? '').trim();
  if (!v) return '2h' as string & {};
  if (/^\d+$/.test(v)) return Number(v);
  return v as string & {};
}

const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
const jwtExpires = coerceJwtExpires(process.env.JWT_EXPIRES || '2h');

@Module({
  imports: [
    PrismaModule,
    // optionnel mais pratique pour préciser la stratégie par défaut
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: jwtExpires },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
