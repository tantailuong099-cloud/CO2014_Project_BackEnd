import { Controller, Get, Param, Post, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Controller('user')
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
  async getProfile(@Req() req) {
    const userId = req.user.userId;
    return this.userService.getProfile(userId);
  }
}
