import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

// Durée acceptée par jsonwebtoken (typée comme ms.StringValue côté @nestjs/jwt)
type MsUnit = 'ms' | 's' | 'm' | 'h' | 'd';
type MsString = `${number}${MsUnit}`;

/** Parse JWT_EXPIRES: nombre de secondes ("3600") ou durée style "2h","30m","7d". */
function getExpires(): number | MsString {
  const raw = (process.env.JWT_EXPIRES ?? '').trim();
  if (!raw) return '2h';
  if (/^\d+$/.test(raw)) return Number(raw);
  // Valide un pattern minimal compatible avec ms
  if (/^\d+\s*(ms|s|m|h|d)$/i.test(raw)) {
    const [num, unit] = raw.replace(/\s+/g, '').match(/^(\d+)(ms|s|m|h|d)$/i)!.slice(1) as [string, MsUnit];
    return `${Number(num)}${unit}` as MsString;
  }
  // fallback sûr
  return '2h';
}

const jwtSecret: string = process.env.JWT_SECRET || 'dev-secret';
const jwtExpires: number | MsString = getExpires();

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtSecret,
      signOptions: {
        // Typage strict: number | MsString correspond à number | StringValue
        expiresIn: jwtExpires,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
