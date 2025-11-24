import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Administrator } from './administrator.entity';
import { Guest } from './guest.entity';
import { Host } from './host.entity';

@Entity('user')
export class User {
  @PrimaryColumn({ name: 'User_ID' })
  userId: string;

  @Column()
  Name: string;

  @Column({ type: 'date', nullable: true })
  BirthDate: Date;

  @Column({ nullable: true })
  Nationality: string;

  @Column({ unique: true })
  Email: string;

  @Column()
  Password: string;

  @Column({ unique: true, nullable: true })
  PhoneNumber: string;

  @Column({ unique: true, nullable: true })
  SSN: string;

  @Column({ type: 'date', name: 'Joined_Date' })
  joinedDate: Date;

  @Column({ name: 'Bank_Account', nullable: true })
  bankAccount: string;

  @Column({ name: 'Admin_ID', nullable: true })
  adminId: string;

  @ManyToOne(() => Administrator, (a) => a.users, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Admin_ID' })
  admin: Administrator;

  @OneToMany(() => Guest, (g) => g.user)
  guests: Guest[];

  @OneToMany(() => Host, (h) => h.user)
  hosts: Host[];
}
