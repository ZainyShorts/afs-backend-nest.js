import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/user/dto/login-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.authService.login(loginDto);
    // Set httpOnly cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false, // set to true if using https
      maxAge: 3600000,
      sameSite: 'lax',
    });

    return { message: 'Login successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('test')
  async test(@Request() req) {
    console.log(req.user);
    return this.authService.test(req.user);
  }
}
