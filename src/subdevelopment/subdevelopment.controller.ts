import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { SubDevelopmentService } from './subdevelopment.service';
import { CreateSubDevelopmentDto } from './dto/create-sub-development.dto';
import { SubDevelopmentFilterInput } from './dto/sub-development-filter.input';

@Controller('subDevelopment')
export class SubDevelopmentController {
  constructor(private readonly service: SubDevelopmentService) {}

  @Post('addSingleRecord')
  create(@Body() dto: CreateSubDevelopmentDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query() filter: SubDevelopmentFilterInput,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
    @Query('populate') populate?: string,
  ) {
    return this.service.findAll(
      filter,
      +page,
      +limit,
      sortBy,
      sortOrder,
      populate,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('populate') populate?: string) {
    return this.service.findOne(id, populate);
  }

  @Patch('updateSingleRecord/:id')
  update(@Param('id') id: string, @Body() dto: CreateSubDevelopmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
