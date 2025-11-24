import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from './booking.entity';
import { Guest } from './guest.entity';

@Entity('payment')
export class Payment {
  @PrimaryColumn({ name: 'Payment_ID' })
  paymentId: string;

  @Column({ name: 'Booking_ID' })
  bookingId: string;

  @Column({ name: 'Guest_ID' })
  guestId: string;

  @Column({ name: 'Payment_Method' })
  paymentMethod: string;

  @Column({
    name: 'Amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  amount: number;

  @Column({ name: 'Currency' })
  currency: string;

  @Column({ name: 'Payment_Status' })
  paymentStatus: string;

  @Column({ name: 'Paid_At', type: 'date' })
  paidAt: Date;

  @ManyToOne(() => Booking, (b) => b.payments, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Booking_ID' })
  booking: Booking;

  @ManyToOne(() => Guest, (g) => g.payments, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Guest_ID' })
  guest: Guest;
}
