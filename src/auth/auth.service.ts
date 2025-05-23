import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from 'src/user/dto/login-user.dto';
import { UserService } from 'src/user/user.service';
// import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  async test(data: any) {
    return data;
  }

  async validateUser(email: string, pass: string) {
    const user = await this.userService.findByEmail(email);
    if (
      user &&
      (await this.userService.comparePasswords(pass, user.password))
    ) {
      const { ...result } = user.toObject();
      return result;
    }
    return null;
  }

  // Login user
  async login(loginDto: LoginDto): Promise<any> {
    try {
      const user: any = await this.userService.findByEmail(loginDto.email);

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await this.userService.comparePasswords(
        loginDto.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      await this.userService.updateLastLogin(user._id, new Date());
      const payload = { useremail: user.email, userId: user._id };
      return this.jwtService.sign(payload);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      console.error('Unexpected error during login:', error);
      throw new InternalServerErrorException(
        'Failed to login. Please try again later.',
      );
    }
  }
}
