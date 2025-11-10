import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import type { StringValue } from 'ms'; // 👈 important

const jwtSecret = process.env.JWT_SECRET || 'dev-secret';

// On force le type vers StringValue (format '2h', '10m', '30s', etc.)
const jwtExpires: StringValue = (process.env.JWT_EXPIRES as StringValue) || '2h';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: {
        expiresIn: jwtExpires, // ✅ maintenant c’est bien: number | StringValue | undefined
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
