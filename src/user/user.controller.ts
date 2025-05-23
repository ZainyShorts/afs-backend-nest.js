// user.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Create user
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // Get all users
  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  // Get user by ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.findOneById(id);
  }

  // Delete user
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  // Update user
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<CreateUserDto>,
  ) {
    return this.userService.update(id, updateUserDto);
  }
}
