import { Controller, Get, Param } from '@nestjs/common';
import { GuestService } from './guest.service';

@Controller('guests')
export class GuestController {
  constructor(private readonly guestService: GuestService) { }

  // API: GET /guests/:id/stats
  // Mục đích: Xem mình đã đi bao nhiêu chuyến, viết bao nhiêu review
  @Get(':id/stats')
  getGuestStats(@Param('id') guestId: string) {
    return this.guestService.getGuestStats(guestId);
  }
}