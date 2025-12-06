// CO2014_Project_BackEnd\src\booking\dto\complete-payment.dto.ts

import { IsString, IsNumber } from 'class-validator';

export class CompletePaymentDto {
  @IsString()
  paymentMethod: string;

  @IsString()
  currency: string;
}