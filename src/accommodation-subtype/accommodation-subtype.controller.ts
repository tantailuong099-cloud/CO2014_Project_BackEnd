import { Controller } from '@nestjs/common';
import { AccommodationSubtypeService } from './accommodation-subtype.service';

@Controller('accommodation-subtype')
export class AccommodationSubtypeController {
  constructor(
    private readonly accommodationSubTypeService: AccommodationSubtypeService,
  ) {}
}
