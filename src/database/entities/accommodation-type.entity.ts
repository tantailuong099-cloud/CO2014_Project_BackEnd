import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity('accommodation_type')
export class AccommodationType {
  @PrimaryColumn({ name: 'Type_ID' })
  typeId: string;

  @Column({ name: 'Type_Name' })
  typeName: string;

  @Column({ name: 'Parent_Type_ID', nullable: true })
  parentTypeId: string;

  @Column({
    name: 'Base_Price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  basePrice: number;

  @Column({ name: 'Room_Type', nullable: true })
  roomType: string;

  @ManyToOne(() => AccommodationType, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Parent_Type_ID' })
  parent: AccommodationType;

  @OneToMany(() => AccommodationType, (t) => t.parent)
  children: AccommodationType[];
}
