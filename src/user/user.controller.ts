// user.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
  Query,
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

  @Patch(':id/access')
  async changeAccess(@Param('id') id: string, @Body('access') access: boolean) {
    return this.userService.updateUserAccess(id, access);
  }

  @Patch(':id/ban')
  async changeBanStatus(
    @Param('id') id: string,
    @Body('banned') banned: boolean,
  ) {
    return this.userService.updateBanStatus(id, banned);
  }

  // Get all users
  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
  ) {
    const pageNum = parseInt(page as any, 10);
    const limitNum = parseInt(limit as any, 10);
    return this.userService.findAllPaginated(pageNum, limitNum, search);
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
