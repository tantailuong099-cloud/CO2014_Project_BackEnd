import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class GuestService {
  constructor(private readonly databaseService: DatabaseService) {}
}
