import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Contact } from './contact.entity';
import { Reviews } from './reviews.entity';
import { Booking } from './booking.entity';
import { Payment } from './payment.entity';

@Entity('guest')
export class Guest {
  @PrimaryColumn({ name: 'Guest_ID' })
  guestId: string;

  @Column({ name: 'Preferred_Payment', default: 'Cash' })
  preferredPayment: string;

  @Column({ name: 'Travel_Interests', type: 'text', nullable: true })
  travelInterests: string;

  @Column({ name: 'Bookings_Count', default: 0 })
  bookingsCount: number;

  @Column({ name: 'Reviews_Count', default: 0 })
  reviewsCount: number;

  @OneToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'Guest_ID' })
  user: User;

  @OneToMany(() => Contact, (c) => c.guest)
  contacts: Contact[];

  @OneToMany(() => Reviews, (r) => r.guest)
  reviews: Reviews[];

  @OneToMany(() => Booking, (b) => b.guest)
  bookings: Booking[];

  @OneToMany(() => Payment, (p) => p.guest)
  payments: Payment[];
}
