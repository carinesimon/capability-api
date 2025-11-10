import { IsEmail, IsOptional, IsString } from 'class-validator';

export class GhlLeadDto {
  @IsString() firstName: string;
  @IsOptional() @IsString() lastName?: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() tag?: string;
  // tu pourras ajouter phone, source, etc.
}
