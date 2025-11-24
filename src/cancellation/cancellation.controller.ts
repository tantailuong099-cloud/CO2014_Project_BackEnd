import { Controller } from '@nestjs/common';
import { CancellationService } from './cancellation.service';

@Controller('cancellation')
export class CancellationController {
  constructor(private readonly cancellationService: CancellationService) {}
}
