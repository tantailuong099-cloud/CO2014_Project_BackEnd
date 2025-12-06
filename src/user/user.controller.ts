import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { UpdateUserProfileDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Get()
  // async findAll() {
  //   return this.userService.getAllUsers();
  // }

  // @Post(':id')
  // async testfunction(@Param('id') id: string) {
  //   return this.userService.testfunction(id);
  // }

  // @Get('test')
  // async testprocedure() {
  //   return this.userService.testprocedure();
  // }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const userId = req.user.userId;
    return this.userService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(@Request() req, @Body() dto: UpdateUserProfileDto) {
    return this.userService.updateProfile(req.user.userId, dto);
  }
}
