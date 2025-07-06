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
import { serialize } from 'cookie';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    // @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    if (result.success === false) {
      return result;
    }
    return { success: true };
  }

  @Post('admin/login')
  async adminLogin(@Body() loginDto: LoginDto) {
    return this.authService.adminLogin(loginDto);
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.setHeader(
      'Set-Cookie',
      serialize('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: new Date(0), // Expire the cookie
      }),
    );

    return res.status(200).json({ message: 'Logged out successfully' });
  }

  @Post('verify-login')
  async verifyLogin(
    @Body() dto: { email: string; otp: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyLogin(dto.email, dto.otp);
    if (result.success === false) {
      return result;
    }

    res.setHeader(
      'Set-Cookie',
      serialize('token', result.token, {
        httpOnly: true, // Cookie not accessible by client JS (better security)
        secure: process.env.NODE_ENV === 'production', // only over HTTPS in prod
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/', // cookie valid for entire site
        sameSite: 'strict',
      }),
    );
    return { message: 'Login successful', success: true, token: result.token };
  }

  @UseGuards(JwtAuthGuard)
  @Get('test')
  async test(@Request() req) {
    console.log(req.user);
    return this.authService.test(req.user);
  }
}
