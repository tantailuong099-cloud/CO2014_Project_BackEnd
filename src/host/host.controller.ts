import { Controller, Get, Param } from '@nestjs/common';
import { HostService } from './host.service';

@Controller('hosts')
export class HostController {
  constructor(private readonly hostService: HostService) { }

  // API: GET /hosts/:id/dashboard
  // Mục đích: Lấy số liệu thống kê cho Dashboard Host
  @Get(':id/dashboard')
  getDashboardStats(@Param('id') hostId: string) {
    return this.hostService.getDashboardStats(hostId);
  }
}