import {
  Body,
  Controller,
  Post,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const data = await this.authService.login(dto);

    // Set HttpOnly Cookie
    res.cookie('access_token', data.access_token, {
      httpOnly: true,
      secure: false, 
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    });

    return data;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.authService.logout();

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: false,
      path: '/',
      sameSite: 'lax',
    });

    return { message: 'Đã đăng xuất' };
  }
}
