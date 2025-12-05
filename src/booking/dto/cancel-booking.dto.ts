// CO2014_Project_BackEnd\src\booking\dto\cancel-booking.dto.ts

import { IsString } from 'class-validator';

export class CancelBookingDto {
  @IsString()
  guestId: string;

  @IsString()
  reason: string;
}
