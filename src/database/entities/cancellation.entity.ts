import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('cancellation')
export class Cancellation {
  @PrimaryGeneratedColumn({ name: 'Cancellation_ID' })
  cancellationId: number;

  @Column({ name: 'Booking_ID' })
  bookingId: string;

  @Column({ name: 'Cancel_Date', type: 'date' })
  cancelDate: Date;

  @Column({ nullable: true })
  Reason: string;

  @Column({ name: 'Refund_Rate', type: 'decimal', precision: 4, scale: 2 })
  refundRate: number;

  @Column({ name: 'Refund_Amount', type: 'decimal', precision: 10, scale: 2 })
  refundAmount: number;

  @ManyToOne(() => Booking, (b) => b.cancellations, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Booking_ID' })
  booking: Booking;
}
