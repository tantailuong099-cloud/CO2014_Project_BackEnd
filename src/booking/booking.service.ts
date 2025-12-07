// CO2014_Project_BackEnd\src\booking\booking.service.ts

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CompletePaymentDto } from './dto/complete-payment.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { ApproveBookingDto } from './dto/approve-booking.dto';

@Injectable()
export class BookingService {
  constructor(private readonly db: DatabaseService) {}

  // -------------------------------------------------------
  // 1. Create Booking
  // -------------------------------------------------------
  async create(dto: CreateBookingDto) {
    try {
      // CALL returns an array of result sets
      const [resultSets] = await this.db.query(
        'CALL sp_CreateBooking(?, ?, ?, ?, ?, @totalPrice, @newBookingID);',
        [
          dto.guestId,
          dto.accommodationId,
          dto.checkInDate,
          dto.checkOutDate,
          dto.guests,
        ]
      );

      // First result set = the SELECT inside your procedure
      const { bookingId, totalPrice } = resultSets[0];

      return {
        message: 'Booking created successfully',
        bookingId,
        totalPrice,
      };
    } catch (err) {
      console.error(
        'Create booking error:',
        err.sqlMessage || err.message || err
      );
      throw new BadRequestException('Unable to create booking');
    }
  }

  // -------------------------------------------------------
  // 2. Complete Payment
  // -------------------------------------------------------
  async completePayment(bookingId: number, dto: CompletePaymentDto) {
    try {
      const [rows] = await this.db.query(
        'CALL sp_CompleteBookingPayment(?, ?, ?, @paymentID, @paidAmount, @message);',
        [bookingId, dto.paymentMethod, dto.currency]
      );

      const result = rows[0]; // because procedure SELECTs one row

      return {
        message: result.message,
        paymentId: result.paymentId,
        amount: result.amount,
        currency: dto.currency,
        bookingId,
      };
    } catch (err) {
      console.error('Finish Payment error:', err?.sqlMessage ?? err?.message);
      throw new BadRequestException('Payment failed');
    }
  }

  // -------------------------------------------------------
  // 3. Cancel Booking
  // -------------------------------------------------------
  async cancel(bookingId: number, dto: CancelBookingDto) {
    try {
      // init OUT param
      await this.db.query('SET @refundAmount = 0;');

      // CALL with IN + OUT
      await this.db.query('CALL sp_CancelBooking(?, ?, ?, @refundAmount);', [
        bookingId,
        dto.guestId,
        dto.reason,
      ]);

      // read OUT
      const rows: any[] = await this.db.query(
        'SELECT @refundAmount AS refundAmount;'
      );
      const refundRow = rows[0];

      return {
        message: 'Booking cancelled successfully',
        bookingId,
        refundAmount: refundRow?.refundAmount ?? 0,
      };
    } catch (err: any) {
      console.error(
        'Cancel booking error:',
        err?.sqlMessage ?? err?.message ?? err
      );
      throw new BadRequestException('Cancellation failed');
    }
  }

  // -------------------------------------------------------
  // 4. Guest History
  // -------------------------------------------------------
  // async getGuestHistory(guestId: string) {
  //   return this.db.query(
  //     `
  //     SELECT *
  //     FROM Booking
  //     WHERE Guest_ID = ?
  //     ORDER BY Check_in DESC
  //     `,
  //     [guestId]
  //   );
  // }

  async getGuestHistory(guestId: string) {
    const sql = `
      SELECT 
        b.Booking_ID, 
        b.Status, 
        b.Total_Price, 
        b.Check_in, 
        b.Check_out, 
        b.Accommodation_ID, 
        a.Title as Accommodation_Title,
        '/image/ACC_001.jpg' as Image,

        -- 👇 THÊM DÒNG NÀY: Kiểm tra xem đã có review chưa (Trả về 1 hoặc 0)
        (SELECT COUNT(*) 
         FROM reviews r 
         WHERE r.Guest_ID = b.Guest_ID 
           AND r.Accommodation_ID = b.Accommodation_ID
        ) as HasReview

      FROM booking b
      JOIN accommodation a ON b.Accommodation_ID = a.Accommodation_ID
      JOIN location l ON a.Location_ID = l.Location_ID
      WHERE b.Guest_ID = ?
      ORDER BY b.Created_At DESC
    `;

    return this.db.query(sql, [guestId]);
  }

  async getGuestActiveHistory(guestId: string) {
    return this.db.query(
      `
        SELECT *
        FROM booking
        WHERE Guest_ID = ?
          AND Status IN ('Pending', 'Confirmed', 'Completed')
        ORDER BY Check_in DESC
      `,
      [guestId]
    );
  }

  // -------------------------------------------------------
  // 5. Host Pending Requests
  // -------------------------------------------------------
  async getHostPendingRequests(hostId: string) {
    return this.db.query(
      `
      SELECT b.*
      FROM booking b
      JOIN accommodation a 
          ON a.Accommodation_ID = b.Accommodation_ID
      JOIN post p 
          ON p.Accommodation_ID = a.Accommodation_ID
      WHERE p.Host_ID = ?
        AND b.Status = 'Pending'
      ORDER BY b.Check_in DESC
      `,
      [hostId]
    );
  }

  // -------------------------------------------------------
  // Host All Bookings (Pending + WaitingPayment + Confirmed + Completed + Cancelled)
  // -------------------------------------------------------
  async getHostAllBookings(hostId: string) {
    return this.db.query(
      `
        SELECT b.*
        FROM booking b
        JOIN accommodation a 
            ON a.Accommodation_ID = b.Accommodation_ID
        JOIN post p 
            ON p.Accommodation_ID = a.Accommodation_ID
        WHERE p.Host_ID = ?
        ORDER BY b.Created_At DESC
      `,
      [hostId]
    );
  }

  // -------------------------------------------------------
  // 6. Booking Detail
  // -------------------------------------------------------
  async getDetail(bookingId: number) {
    const rows: any[] = await this.db.query(
      `
        SELECT *
        FROM booking
        WHERE Booking_ID = ?
      `,
      [bookingId]
    );

    if (!rows.length) {
      throw new NotFoundException('Booking not found');
    }

    return rows[0];
  }

  async approveBooking(bookingId: number, dto: ApproveBookingDto) {
    try {
      const [rows] = await this.db.query(
        'CALL sp_ApproveBooking(?, ?, @message);',
        [bookingId, dto.hostId]
      );

      const result = rows[0];

      return {
        bookingId,
        message: result.message,
      };
    } catch (err) {
      console.error('Host approval error:', err?.sqlMessage ?? err?.message);
      throw new BadRequestException('Host approval failed');
    }
  }

  async findByGuest(guestId: string) {
    const sql = `
      SELECT 
        b.Booking_ID, 
        b.Status, 
        b.Total_Price, 
        b.Check_in, 
        b.Check_out, 
        
        -- 👇 QUAN TRỌNG: Phải SELECT dòng này thì Frontend mới có cái gửi đi Review
        b.Accommodation_ID, 
        
        a.Title as Accommodation_Title,
        -- Giả lập ảnh cover để hiện ở list booking
        '/image/ACC_001.jpg' as Image
      FROM booking b
      JOIN accommodation a ON b.Accommodation_ID = a.Accommodation_ID
      WHERE b.Guest_ID = ?
      ORDER BY b.Created_At DESC
    `;
    return this.db.query(sql, [guestId]);
  }
}
