import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Guest } from './guest.entity';
import { Accommodation } from './accommodation.entity';
import { Payment } from './payment.entity';
import { Cancellation } from './cancellation.entity';

@Entity('booking')
export class Booking {
  @PrimaryColumn({ name: 'Booking_ID' })
  bookingId: string;

  @Column({ name: 'Accommodation_ID' })
  accommodationId: string;

  @Column({ name: 'Guest_ID' })
  guestId: string;

  @Column({ name: 'Check_in', type: 'date' })
  checkIn: Date;

  @Column({ name: 'Check_out', type: 'date' })
  checkOut: Date;

  @Column()
  Status: string;

  @Column({ name: 'Num_Guests' })
  numGuests: number;

  @Column({
    name: 'Total_Price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  totalPrice: number;

  @Column({ name: 'Created_At', type: 'date' })
  createdAt: Date;

  @ManyToOne(() => Guest, (g) => g.bookings, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Guest_ID' })
  guest: Guest;

  @ManyToOne(() => Accommodation, (a) => a.bookings, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Accommodation_ID' })
  accommodation: Accommodation;

  @OneToMany(() => Payment, (p) => p.booking)
  payments: Payment[];

  @OneToMany(() => Cancellation, (c) => c.booking)
  cancellations: Cancellation[];
}
