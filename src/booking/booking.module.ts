// CO2014_Project_BackEnd\src\booking\booking.module.ts

import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [BookingService],
  controllers: [BookingController],
})
export class BookingModule {}
