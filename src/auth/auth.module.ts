import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

const jwtSecret = process.env.JWT_SECRET || 'dev-secret';

/** Convertit "1d" | "2h" | "30m" | "45s" | "3600" en secondes (number). */
function parseExpiresToSeconds(input: string | undefined, fallbackSeconds = 7200): number {
  const raw = (input ?? '').trim();
  if (!raw) return fallbackSeconds;

  // nombre pur → secondes
  if (/^\d+$/.test(raw)) return Number(raw);

  // 123d|h|m|s
  const m = raw.match(/^(\d+)\s*([dhms])$/i);
  if (!m) return fallbackSeconds;

  const val = Number(m[1]);
  const unit = m[2].toLowerCase();
  switch (unit) {
    case 'd': return val * 24 * 60 * 60;
    case 'h': return val * 60 * 60;
    case 'm': return val * 60;
    case 's': return val;
    default:  return fallbackSeconds;
  }
}

const jwtExpiresSeconds = parseExpiresToSeconds(process.env.JWT_EXPIRES || '2h'); // défaut 2h

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      // ICI: on donne un number (secondes) → compatible avec "number | StringValue"
      signOptions: { expiresIn: jwtExpiresSeconds },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
