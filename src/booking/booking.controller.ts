import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { BookingService } from './booking.service';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}
  // 1. Tạo Booking mới
  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingService.create(dto);
  }

  // 2. Host xác nhận & Thanh toán
  @Post(':id/confirm')
  confirm(@Param('id') bookingId: string, @Body() dto: ConfirmBookingDto) {
    return this.bookingService.confirm(bookingId, dto);
  }

  // 3. Guest hủy phòng
  @Post(':id/cancel')
  cancel(@Param('id') bookingId: string, @Body() dto: CancelBookingDto) {
    return this.bookingService.cancel(bookingId, dto);
  }

  // 4. Lấy danh sách chuyến đi của Guest
  @Get('guest/:id')
  getGuestTrips(@Param('id') guestId: string) {
    return this.bookingService.getGuestTrips(guestId);
  }

  // 5. Lấy danh sách yêu cầu đặt phòng cho Host
  @Get('host/:id')
  getHostRequests(@Param('id') hostId: string) {
    return this.bookingService.getHostRequests(hostId);
  }

  // 6. Xem chi tiết một booking
  @Get(':id')
  getDetail(@Param('id') bookingId: string) {
    return this.bookingService.getDetail(bookingId);
  }
}
