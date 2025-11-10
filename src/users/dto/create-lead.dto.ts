import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateLeadDto {
  @IsString() firstName: string;
  @IsOptional() @IsString() lastName?: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() tag?: string;
  @IsOptional() @IsString() assignedTo?: string; // setterId optionnel
  
}
