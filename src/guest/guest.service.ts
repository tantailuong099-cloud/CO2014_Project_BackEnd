import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class GuestService {
  constructor(private readonly db: DatabaseService) { }

  async getGuestStats(guestId: string) {
    // TODO: Viết Raw SQL
    // SELECT Bookings_Count, Reviews_Count FROM guest WHERE Guest_ID = guestId
    // Các số liệu này luôn đúng nhờ Trigger
  }
}