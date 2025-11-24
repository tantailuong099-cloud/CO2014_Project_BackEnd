import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Accommodation } from './accommodation.entity';

@Entity('location')
export class Location {
  @PrimaryColumn({ name: 'Location_ID' })
  locationId: string;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  Latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6 })
  Longitude: number;

  @Column()
  City: string;

  @OneToMany(() => Accommodation, (a) => a.location)
  accommodations: Accommodation[];
}
