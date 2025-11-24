import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AccommodationType } from './accommodation-type.entity';

@Entity('accommodation_subtype')
export class AccommodationSubtype {
  @PrimaryColumn({ name: 'Parent_Type_ID' })
  parentTypeId: string;

  @PrimaryColumn({ name: 'Subtype_ID' })
  subtypeId: string;

  @ManyToOne(() => AccommodationType, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Parent_Type_ID' })
  parent: AccommodationType;

  @ManyToOne(() => AccommodationType, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'Subtype_ID' })
  subtype: AccommodationType;
}
