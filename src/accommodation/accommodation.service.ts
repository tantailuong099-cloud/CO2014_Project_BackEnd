import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchAccommodationDto } from './dto/search-accommodation.dto';

@Injectable()
export class AccommodationService {
  constructor(private readonly databaseService: DatabaseService) {}
}
