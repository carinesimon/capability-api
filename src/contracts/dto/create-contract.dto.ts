import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateContractDto {
  @IsNumber() amount: number;
  @IsOptional() @IsNumber() deposit?: number;
  @IsOptional() @IsNumber() monthly?: number;
  @IsNumber() total: number;

  @IsString() userId: string;     // closer
  @IsOptional() @IsString() leadId?: string; // lead (pour attribuer au setter)
  
}

