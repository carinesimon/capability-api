import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString() firstName: string;
  @IsOptional() @IsString() lastName?: string;
  @IsEmail() email: string;
  @IsEnum(Role) role: Role;
}
