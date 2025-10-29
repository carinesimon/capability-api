import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

// Accepté par jsonwebtoken: "2h", "30m", "7d" ou un nombre de secondes (ex: "3600")
function parseJwtExpires(input?: string): string | number {
  const v = (input ?? '').trim();
  if (!v) return '2h';
  return /^\d+$/.test(v) ? Number(v) : v;
}

const jwtSecret: string = process.env.JWT_SECRET || 'dev-secret';
const jwtExpires: string | number = parseJwtExpires(process.env.JWT_EXPIRES);

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtSecret,
      signOptions: {
        // jsonwebtoken accepte string | number — on reste strictement typé
        expiresIn: jwtExpires,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
