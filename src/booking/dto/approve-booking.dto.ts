// CO2014_Project_BackEnd\src\booking\dto\approve-booking.dto.ts
import { IsString } from 'class-validator';

export class ApproveBookingDto {
  @IsString()
  hostId: string;
}
