import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class RegisterDto {
  // --- USER INFO ---
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  name: string;

  @IsEnum(['GUEST', 'HOST'])
  role: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsDateString() // Dạng YYYY-MM-DD
  birthDate?: string;

  @IsOptional()
  @IsString()
  ssn?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string; // Thêm Bank Account

  // --- GUEST SPECIFIC ---
  @IsOptional()
  @IsEnum(['Cash', 'Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer'])
  preferredPayment?: string;

  @IsOptional()
  @IsString()
  travelInterests?: string;

  // --- HOST SPECIFIC ---
  @IsOptional()
  @IsString()
  taxId?: string;
}
