import { Controller, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll() {
    return this.userService.getAllUsers();
  }

  @Post(':id')
  async testfunction(@Param('id') id: string) {
    return this.userService.testfunction(id);
  }

  @Get('test')
  async testprocedure() {
    return this.userService.testprocedure();
  }
}
