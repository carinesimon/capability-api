import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Length } from "class-validator";

export class AdminUsersQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsEnum(['ADMIN','SETTER','CLOSER'] as any) role?: 'ADMIN'|'SETTER'|'CLOSER';
  @IsOptional() @IsEnum(['true','false'] as any) isActive?: 'true'|'false';
  @IsOptional() page?: string;
  @IsOptional() pageSize?: string;
}

export class AdminCreateUserDto {
  @IsString() @Length(1, 80) firstName!: string;
  @IsString() @Length(1, 80) lastName!: string;
  @IsEmail() email!: string;
  @IsEnum(['ADMIN','SETTER','CLOSER'] as any) role!: 'ADMIN'|'SETTER'|'CLOSER';
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() tempPassword?: string;
}

export class AdminUpdateUserDto {
  @IsOptional() @IsString() @Length(1,80) firstName?: string;
  @IsOptional() @IsString() @Length(1,80) lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsEnum(['ADMIN','SETTER','CLOSER'] as any) role?: 'ADMIN'|'SETTER'|'CLOSER';
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() tempPassword?: string;
  
}

