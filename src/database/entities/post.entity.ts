import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Accommodation } from './accommodation.entity';
import { Host } from './host.entity';

@Entity('post')
export class Post {
  @PrimaryColumn({ name: 'Accommodation_ID' })
  accommodationId: string;

  @PrimaryColumn({ name: 'Host_ID' })
  hostId: string;

  @Column({ name: 'Post_Date', type: 'date' })
  postDate: Date;

  @ManyToOne(() => Accommodation, (a) => a.posts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Accommodation_ID' })
  accommodation: Accommodation;

  @ManyToOne(() => Host, (h) => h.posts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Host_ID' })
  host: Host;
}
