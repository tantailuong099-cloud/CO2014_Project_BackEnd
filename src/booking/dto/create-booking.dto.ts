// CO2014_Project_BackEnd\src\booking\dto\create-booking.dto.ts

import { IsString, IsInt, IsDateString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  guestId: string;

  @IsString()
  accommodationId: string;

  @IsDateString()
  checkInDate: string;

  @IsDateString()
  checkOutDate: string;

  @IsInt()
  guests: number;
}
