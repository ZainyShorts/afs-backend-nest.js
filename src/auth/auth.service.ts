import { chooseContentTypeForSingleResultResponse } from '@apollo/server/dist/esm/ApolloServer';
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
  // async login(loginDto: LoginDto): Promise<any> {
  //   try {
  //     const user: any = await this.userService.findByEmail(loginDto.email);

  //     if (!user) {
  //       return {
  //         success: false,
  //         message: `User not found`,
  //       };
  //     }

  //     if (user.ban) {
  //       const ONE_HOUR = 60 * 1000; // 1 hour in ms
  //       const now = Date.now();
  //       const updatedTime = new Date(user.updatedAt).getTime();
  //       const diff = ONE_HOUR - (now - updatedTime);
  //       if (diff <= 0) {
  //         // More than 1 hour passed
  //         user.ban = false;
  //         user.attempts = 3;
  //         user.save();
  //       } else {
  //         // Calculate minutes and seconds remaining
  //         const minutes = Math.floor(diff / 60000);
  //         const seconds = Math.floor((diff % 60000) / 1000);

  //         // Format with leading zeros
  //         const formatted = `${minutes.toString().padStart(2, '0')}:${seconds
  //           .toString()
  //           .padStart(2, '0')}`;
  //         return {
  //           success: false,
  //           message: `Too many failed attempts. Try again in ${formatted}.`,
  //         };
  //       }
  //     }

  //     const isPasswordValid = await this.userService.comparePasswords(
  //       loginDto.password,
  //       user.password,
  //     );
  //     if (!isPasswordValid) {
  //       if (user.attempts <= 0) {
  //         user.ban = true;
  //       }
  //       if (user.attempts === 1) {
  //         user.attempts = user.attempts - 1;
  //         user.ban = true;
  //       }
  //       user.save();
  //       return {
  //         success: false,
  //         message: `Invalid email or password.`,
  //       };
  //     }

  //     await this.userService.updateLastLogin(user._id, new Date());
  //     const payload = { useremail: user.email, userId: user._id };
  //     user.attempts = 3;
  //     user.save();
  //     return {
  //       success: true,
  //       token: this.jwtService.sign(payload),
  //     };
  //   } catch (error) {
  //     if (error instanceof UnauthorizedException) {
  //       throw error;
  //     }

  //     console.error('Unexpected error during login:', error);
  //     throw new InternalServerErrorException(
  //       'Failed to login. Please try again later.',
  //     );
  //   }
  // }
  async login(loginDto: LoginDto): Promise<any> {
    try {
      const user: any = await this.userService.findByEmail(loginDto.email);

      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Ban duration - 60 seconds for testing, update to 3600000 for production
      const BAN_DURATION = 60 * 1000;

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
            message: `Too many failed attempts. Try again in ${formatted}.`,
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
            : `Invalid email or password. Attempts left: ${user.attempts}`,
        };
      }

      // Successful login - reset attempts and ban
      user.attempts = 3;
      user.ban = false;
      await user.save();

      await this.userService.updateLastLogin(user._id, new Date());

      const payload = { useremail: user.email, userId: user._id };
      return {
        success: true,
        token: this.jwtService.sign(payload),
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
}
