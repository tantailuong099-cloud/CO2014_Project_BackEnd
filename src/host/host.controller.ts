import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  Body,
  Post,
  Put,
  Delete,
} from '@nestjs/common';
import { HostService } from './host.service';
import { CreateHostDto } from './dto/create-host.dto';
import { UpdateHostDto } from './dto/update-host.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Controller('hosts')
export class HostController {
  constructor(private readonly hostService: HostService) {}

  // // API: GET /hosts/:id/dashboard
  // // Mục đích: Lấy số liệu thống kê cho Dashboard Host
  // @Get(':id/dashboard')
  // getDashboardStats(@Param('id') hostId: string) {
  //   return this.hostService.getDashboardStats(hostId);
  // }
  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  getDashboardStats(@Request() req) {
    // req.user.userId lấy từ Token
    return this.hostService.getDashboardStats(req.user.userId);
  }
  @Get()
  async findAll() {
    return await this.hostService.findAll();
  }

  @Post('create')
  async create(@Body() createHostDto: CreateHostDto) {
    return await this.hostService.create(createHostDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.hostService.findOne(id);
  }

  @Put('update/:id')
  async update(@Param('id') id: string, @Body() updateHostDto: UpdateHostDto) {
    return this.hostService.update(id, updateHostDto);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return this.hostService.remove(id);
  }
}
