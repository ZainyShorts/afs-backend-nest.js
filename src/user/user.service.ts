// user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './schema/user.schema';
import { Types } from 'mongoose';
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

  // Get all users
  async findAllPaginated(
    page: number,
    limit: number,
    search: string,
  ): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const query: any = {
        // role: { $ne: 'admin' },
      };

      if (search) {
        query.name = { $regex: search, $options: 'i' }; // case-insensitive search
      }

      const [users, total] = await Promise.all([
        this.userModel
          .find(query)
          .select('-password')
          .skip(skip)
          .limit(limit)
          .exec(),
        this.userModel.countDocuments(query),
      ]);

      return {
        totalRecords: total,
        currentPage: page,
        limit: limit,
        users,
      };
    } catch (error) {
      console.error('Error fetching paginated users with search:', error);
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

  async updateUserAccess(userId: string, access: boolean): Promise<any> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(userId, { access }, { new: true })
        .select('-password');

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return {
        message: 'User access updated successfully',
        user: updatedUser,
      };
    } catch (error) {
      console.error('Error updating access:', error);
      throw error;
    }
  }

  async updateBanStatus(userId: string, banned: boolean): Promise<any> {
    try {
      const updateFields: any = {
        banned,
        attempts: banned ? 0 : 3,
      };

      const updatedUser = await this.userModel
        .findByIdAndUpdate(userId, updateFields, { new: true })
        .select('-password');

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return {
        message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
        user: updatedUser,
      };
    } catch (error) {
      console.error('Error updating ban status:', error);
      throw error;
    }
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async comparePasswords(plainText: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plainText, hashed);
  }

  // user.service.ts
  async updateLastLogin(userId: Types.ObjectId, date: Date): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { lastLogin: date });
  }
}
