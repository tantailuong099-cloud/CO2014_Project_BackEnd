import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdministratorService } from './administrator.service';
import { GetUsersDto } from './dto/get-users.dto';
import { CreateAdminUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdministratorController {
  constructor(private readonly adminService: AdministratorService) {}

  @Get('users')
  getUsers(@Query() query: GetUsersDto, @Request() req) {
    const currentAdminId = req.user.userId;
    return this.adminService.findAll(query, currentAdminId);
  }

  @Post('users')
  createUser(@Body() dto: CreateAdminUserDto, @Request() req) {
    const currentAdminId = req.user.userId;
    return this.adminService.createUser(dto, currentAdminId);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string, @Request() req) {
    const currentAdminId = req.user.userId;
    return this.adminService.findOne(id, currentAdminId);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string, @Request() req) {
    const currentAdminId = req.user.userId;
    return this.adminService.deleteUser(id, currentAdminId);
  }

  @Get('stats')
  getStats(@Request() req) {
    const currentAdminId = req.user.userId;
    return this.adminService.getStats(currentAdminId);
  }

  @Post('sync')
  syncData() {
    return this.adminService.syncSystemData();
  }
}
