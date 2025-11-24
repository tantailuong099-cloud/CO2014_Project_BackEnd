import { Module } from '@nestjs/common';
import { AccommodationTypeController } from './accommodation-type.controller';
import { AccommodationTypeService } from './accommodation-type.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AccommodationTypeController],
  providers: [AccommodationTypeService],
})
export class AccommodationTypeModule {}
