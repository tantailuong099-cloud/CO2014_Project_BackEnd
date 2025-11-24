import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Location } from './location.entity';
import { AccommodationType } from './accommodation-type.entity';
import { Post } from './post.entity';
import { Reviews } from './reviews.entity';
import { Booking } from './booking.entity';

@Entity('accommodation')
export class Accommodation {
  @PrimaryColumn({ name: 'Accommodation_ID' })
  accommodationId: string;

  @Column()
  Title: string;

  @Column({ type: 'text' })
  Description: string;

  @Column({ name: 'Location_ID' })
  locationId: string;

  @Column({ nullable: true })
  Neighborhood: string;

  @Column({ name: 'Type_ID' })
  typeId: string;

  @Column({ name: 'Max_Guests', default: 1 })
  maxGuests: number;

  @Column({ name: 'Num_Beds', default: 0 })
  numBeds: number;

  @Column({ name: 'Num_Bedrooms', default: 0 })
  numBedrooms: number;

  @Column({ name: 'Num_Bathrooms', default: 0 })
  numBathrooms: number;

  @Column({ type: 'text', nullable: true })
  Amenities: string;

  @Column({
    name: 'Price_Per_Night',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  pricePerNight: number;

  @Column({ name: 'Is_Instant_Bookable', default: false })
  isInstantBookable: boolean;

  @Column({ name: 'Total_Reviews', default: 0 })
  totalReviews: number;

  @Column({
    name: 'Annual_Revenue_Estimated',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  annualRevenueEstimated: number;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'Location_ID' })
  location: Location;

  @ManyToOne(() => AccommodationType, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Type_ID' })
  type: AccommodationType;

  @OneToMany(() => Post, (p) => p.accommodation)
  posts: Post[];

  @OneToMany(() => Reviews, (r) => r.accommodation)
  reviews: Reviews[];

  @OneToMany(() => Booking, (b) => b.accommodation)
  bookings: Booking[];
}
