import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccommodationService } from './accommodation.service';
import { AccommodationController } from './accommodation.controller';
import { Accommodation } from 'src/database/entities/accommodation.entity'; // Import Entity

@Module({
  imports: [TypeOrmModule.forFeature([Accommodation])], // <--- DÒNG QUAN TRỌNG NHẤT
  controllers: [AccommodationController],
  providers: [AccommodationService],
  exports: [AccommodationService],
})
export class AccommodationModule {}