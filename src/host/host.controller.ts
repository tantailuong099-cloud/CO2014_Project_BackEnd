import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { HostService } from './host.service';
import { CreateHostDto } from './dto/create-host.dto';
import { UpdateHostDto } from './dto/update-host.dto';

@Controller('hosts')
export class HostController {
  constructor(private readonly hostService: HostService) {}

  // // API: GET /hosts/:id/dashboard
  // // Mục đích: Lấy số liệu thống kê cho Dashboard Host
  // @Get(':id/dashboard')
  // getDashboardStats(@Param('id') hostId: string) {
  //   return this.hostService.getDashboardStats(hostId);
  // }

  @Get()
  async findAll() {
    return await this.hostService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.hostService.findOne(id);
  }

  @Post('create')
  async create(@Body() createHostDto: CreateHostDto) {
    return await this.hostService.create(createHostDto);
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
