// user.service.ts
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginDto } from './dto/login-user.dto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './schema/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  // Create user
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { password, ...userData } = createUserDto;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new this.userModel({
        ...userData,
        password: hashedPassword,
      });
      return await user.save();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Login user
  async login(loginDto: LoginDto): Promise<User> {
    try {
      const user = await this.userModel.findOne({ email: loginDto.email });

      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid email or password');
      }

      user.lastLogin = new Date();
      await user.save();
      return user;
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

  // Get all users
  async findAll(): Promise<User[]> {
    try {
      return await this.userModel
        .find({ role: { $ne: 'admin' } }) // Exclude users with 'admin' role
        .select('-password') // Exclude the password field
        .exec();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  async findOneById(id: string): Promise<User | null> {
    try {
      return await this.userModel
        .findById(id)
        .select('-password') // Exclude the password field
        .exec();
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  // Delete user
  async delete(id: string): Promise<void> {
    try {
      await this.userModel.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Update user
  async update(
    id: string,
    updateUserDto: Partial<CreateUserDto>,
  ): Promise<User | null> {
    try {
      return await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .exec();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
}
