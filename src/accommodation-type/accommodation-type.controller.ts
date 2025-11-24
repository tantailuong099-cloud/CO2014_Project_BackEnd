import { Controller } from '@nestjs/common';
import { AccommodationTypeService } from './accommodation-type.service';

@Controller('accommodation-type')
export class AccommodationTypeController {
  constructor(
    private readonly accommodationTypeService: AccommodationTypeService,
  ) {}
}
