import { Module } from '@nestjs/common';
import { AccommodationSubtypeService } from './accommodation-subtype.service';
import { AccommodationSubtypeController } from './accommodation-subtype.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AccommodationSubtypeService],
  controllers: [AccommodationSubtypeController],
})
export class AccommodationSubtypeModule {}
