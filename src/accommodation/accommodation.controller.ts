import { Controller } from '@nestjs/common';
import { AccommodationService } from './accommodation.service';

@Controller('accommodation')
export class AccommodationController {
  constructor(private readonly accommodationService: AccommodationService) {}
}
