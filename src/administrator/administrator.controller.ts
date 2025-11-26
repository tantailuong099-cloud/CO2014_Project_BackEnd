import { Controller } from '@nestjs/common';
import { AdministratorService } from './administrator.service';

@Controller('administrator')
export class AdministratorController {
  constructor(private readonly administratorService: AdministratorService) {}

  // API: POST /admin/sync-data
  // Mục đích: Chạy lại toàn bộ số đếm (Maintenance)
  @Post('sync-data')
  syncData() {
    return this.adminService.syncData();
  }

  // API: GET /admin/users
  // Mục đích: Lấy danh sách user để quản lý
  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  // API: DELETE /admin/users/:id
  // Mục đích: Xóa/Ban user
  @Delete('users/:id')
  deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }
  
}
