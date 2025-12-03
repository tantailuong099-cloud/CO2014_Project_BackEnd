import { Controller, Get, Param, Query } from '@nestjs/common';
import { AccommodationService } from './accommodation.service';

@Controller('accommodation')
export class AccommodationController {
  constructor(private readonly accommodationService: AccommodationService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('guests') guests?: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string,
  ) {
    // Chuyển đổi guests từ string sang number (mặc định là 1)
    const guestCount = guests ? parseInt(guests, 10) : 1;
    
    return this.accommodationService.findAll(search, guestCount, checkIn, checkOut);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accommodationService.findOne(id);
  }
}