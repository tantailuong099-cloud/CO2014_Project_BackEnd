import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phoneNumber?: string;
  @IsOptional() @IsDateString() birthDate?: string;
  @IsOptional() @IsString() nationality?: string;

  // Common New Fields
  @IsOptional() @IsString() ssn?: string;
  @IsOptional() @IsString() bankAccount?: string;

  // Host Fields
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsString() responseTime?: string;

  // Guest Fields
  @IsOptional() @IsString() preferredPayment?: string;
  @IsOptional() @IsString() travelInterests?: string;
}
