import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Guest } from './guest.entity';
import { Accommodation } from './accommodation.entity';

@Entity('reviews')
export class Reviews {
  @PrimaryColumn({ name: 'Review_ID' })
  reviewId: string;

  @Column({ name: 'Guest_ID' })
  guestId: string;

  @Column({ name: 'Accommodation_ID' })
  accommodationId: string;

  @Column({ name: 'Review_Date', type: 'date' })
  reviewDate: Date;

  @Column({ type: 'text', nullable: true })
  Comments: string;

  @Column()
  Ratings: number;

  @ManyToOne(() => Guest, (g) => g.reviews, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Guest_ID' })
  guest: Guest;

  @ManyToOne(() => Accommodation, (a) => a.reviews, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Accommodation_ID' })
  accommodation: Accommodation;
}
