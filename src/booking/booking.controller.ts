// CO2014_Project_BackEnd\src\booking\booking.controller.ts

import { 
  Controller, Post, Get, Param, Body, ParseIntPipe 
} from '@nestjs/common';

import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CompletePaymentDto } from './dto/complete-payment.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { ApproveBookingDto } from './dto/approve-booking.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // -------------------------------------------------------
  // 1. Create Booking
  // POST /booking
  // -------------------------------------------------------
  @Post()
  async createBooking(@Body() dto: CreateBookingDto) {
    return this.bookingService.create(dto);
  }

  // -------------------------------------------------------
  // 2. Complete Payment
  // POST /booking/:id/payment
  // -------------------------------------------------------
  @Post(':id/payment')
  async completePayment(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body() dto: CompletePaymentDto,
  ) {
    return this.bookingService.completePayment(bookingId, dto);
  }

  // -------------------------------------------------------
  // 3. Cancel Booking
  // POST /booking/:id/cancel
  // -------------------------------------------------------
  @Post(':id/cancel')
  async cancelBooking(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingService.cancel(bookingId, dto);
  }

  // -------------------------------------------------------
  // 4. Guest Full Booking History
  // GET /booking/guest/:guestId/history
  // (Cancelled + Pending + Confirmed + Completed)
  // -------------------------------------------------------
  @Get('guest/:guestId/history')
  async getGuestHistory(@Param('guestId') guestId: string) {
    return this.bookingService.getGuestHistory(guestId);
  }

  // -------------------------------------------------------
  // 5. Guest Active Bookings
  // GET /booking/guest/:guestId/active
  // (Pending + Confirmed + Completed)
  // -------------------------------------------------------
  @Get('guest/:guestId/active')
  async getGuestActiveHistory(@Param('guestId') guestId: string) {
    return this.bookingService.getGuestActiveHistory(guestId);
  }

  // -------------------------------------------------------
  // 6. Host Pending Requests
  // GET /booking/host/:hostId/pending
  // -------------------------------------------------------
  @Get('host/:hostId/pending')
  async getHostPendingRequests(@Param('hostId') hostId: string) {
    return this.bookingService.getHostPendingRequests(hostId);
  }

  // -------------------------------------------------------
  // Host All Bookings
  // GET /booking/host/:hostId/all
  // -------------------------------------------------------
  @Get('host/:hostId/all')
  async getHostAllBookings(@Param('hostId') hostId: string) {
    return this.bookingService.getHostAllBookings(hostId);
  }

  // -------------------------------------------------------
  // 7. Booking Detail
  // GET /booking/:id
  // -------------------------------------------------------
  @Get(':id')
  async getBookingDetail(@Param('id', ParseIntPipe) bookingId: number) {
    return this.bookingService.getDetail(bookingId);
  }

  @Post(':id/approve')
  async approveBooking(
    @Param('id', ParseIntPipe) bookingId: number,
    @Body() dto: ApproveBookingDto
  ) {
    return this.bookingService.approveBooking(bookingId, dto);
  }
}