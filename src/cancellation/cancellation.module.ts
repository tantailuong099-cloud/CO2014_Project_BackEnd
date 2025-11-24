import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { CancellationController } from './cancellation.controller';
import { CancellationService } from './cancellation.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CancellationController],
  providers: [CancellationService],
})
export class CancellationModule {}
