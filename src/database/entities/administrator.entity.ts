import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('administrator')
export class Administrator {
  @PrimaryGeneratedColumn({ name: 'id_num' })
  idNum: number;

  @Column({ name: 'Admin_ID', unique: true })
  adminId: string;

  @Column()
  Name: string;

  @Column()
  Password: string;

  @Column({ type: 'date', nullable: true })
  BirthDate: Date;

  @Column({ nullable: true })
  Nationality: string;

  @Column({ unique: true })
  Email: string;

  @Column({ nullable: true })
  PhoneNumber: string;

  @Column({ nullable: true })
  ProfilePicture: string;

  @OneToMany(() => User, (u) => u.admin)
  users: User[];
}
