// CO2014_Project_BackEnd\src\booking\dto\confirm-booking.dto.ts

import { IsString, IsNumber } from 'class-validator';

export class CompletePaymentDto {
  @IsString()
  paymentMethod: string;

  @IsString()
  currency: string;
}