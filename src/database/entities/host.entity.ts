import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Contact } from './contact.entity';

@Entity('host')
export class Host {
  @PrimaryColumn({ name: 'Host_ID' })
  hostId: string;

  @Column({ name: 'Tax_ID', unique: true, nullable: true })
  taxId: string;

  @Column({ name: 'Response_Time', default: 'unknown', nullable: true })
  responseTime: string;

  @Column({
    name: 'Acceptance_Rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  acceptanceRate: number;

  @Column({ name: 'Is_Superhost', default: false })
  isSuperhost: boolean;

  @Column({ name: 'Listings_Count', default: 0 })
  listingsCount: number;

  @OneToOne(() => User, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'Host_ID' })
  user: User;

  @OneToMany(() => Post, (p) => p.host)
  posts: Post[];

  @OneToMany(() => Contact, (c) => c.host)
  contacts: Contact[];
}
