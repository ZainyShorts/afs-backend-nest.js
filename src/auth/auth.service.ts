import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import { LoginDto } from 'src/user/dto/login-user.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  async test(data: any) {
    return data;
  }

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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

  async login(loginDto: LoginDto): Promise<any> {
    try {
      const user: any = await this.userService.findByEmail(loginDto.email);

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      if (!user.access) {
        return {
          success: false,
          message: 'Your Access blocked by admin 🚫',
        };
      }

      // Ban duration - 60 seconds for testing, update to 3600000 for production
      const BAN_DURATION = 60 * 60 * 1000;

      if (user.ban) {
        const now = Date.now();
        const updatedTime = new Date(user.updatedAt).getTime();
        const diff = BAN_DURATION - (now - updatedTime);

        if (diff <= 0) {
          // Ban expired, reset ban and attempts
          user.ban = false;
          user.attempts = 3;
          await user.save();
        } else {
          // Calculate remaining time MM:SS
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

          return {
            success: false,
            message: `Too many failed attempts. Try again in ${formatted}`,
          };
        }
      }

      // Check password validity
      const isPasswordValid = await this.userService.comparePasswords(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        // Decrement attempts if attempts is set, else initialize to 3 then decrement
        user.attempts =
          typeof user.attempts === 'number' ? user.attempts - 1 : 2;

        // If attempts exhausted, ban user and update updatedAt to start ban timer
        if (user.attempts <= 0) {
          user.ban = true;
          user.updatedAt = new Date();
        }

        await user.save();

        return {
          success: false,
          message: user.ban
            ? 'Too many failed attempts. You are banned for 1 hour.'
            : `Invalid email or password`,
        };
      }

      // Successful login - reset attempts and ban
      const otp = this.generateOTP();
      user.attempts = 3;
      user.ban = false;
      user.lastOtp = otp;
      await user.save();

      await this.userService.updateLastLogin(user._id, new Date());

      this.mailService.sendOtpEmail(user.email, otp);
      return {
        success: true,
      };
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

  async verifyLogin(email: string, otp: string) {
    try {
      const user: any = await this.userService.findByEmail(email);

      if (!user) {
        return {
          success: false,
          messsage: 'Uer not found',
        };
      }

      if (user.lastOtp === otp) {
        const payload = {
          useremail: user.email,
          userId: user._id,
          role: user.role,
        };
        return {
          success: true,
          token: this.jwtService.sign(payload),
        };
      }

      return {
        success: false,
        message: 'Invalid otp. Pleease try again.',
      };
    } catch (e) {
      console.log(e);
      return {
        success: false,
        message: 'Failed to verify login. Pleease try again later.',
      };
    }
  }
}
