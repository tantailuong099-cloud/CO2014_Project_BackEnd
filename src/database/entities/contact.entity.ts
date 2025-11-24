import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Guest } from './guest.entity';
import { Host } from './host.entity';

@Entity('contact')
export class Contact {
  @PrimaryGeneratedColumn({ name: 'Contact_ID' })
  contactId: number;

  @Column({ name: 'Guest_ID' })
  guestId: string;

  @Column({ name: 'Host_ID' })
  hostId: string;

  @ManyToOne(() => Guest, (g) => g.contacts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Guest_ID' })
  guest: Guest;

  @ManyToOne(() => Host, (h) => h.contacts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Host_ID' })
  host: Host;
}
