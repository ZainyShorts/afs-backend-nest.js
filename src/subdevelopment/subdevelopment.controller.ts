import { AuthGuard } from '@nestjs/passport';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SubDevelopmentService } from './subdevelopment.service';
import { CreateSubDevelopmentDto } from './dto/create-sub-development.dto';
import { SubDevelopmentFilterInput } from './dto/sub-development-filter.input'; 
import { ApiResponse, ApiOperation , ApiParam } from '@nestjs/swagger';

import { FileInterceptor } from '@nestjs/platform-express';
import {
  multerOptionsForXlxs,
  UploadedFileType,
} from 'utils/multer/multer.config';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RequestWithUser } from 'utils/interface/interfaces';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('subDevelopment')
export class SubDevelopmentController {
  constructor(private readonly service: SubDevelopmentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('addSingleRecord')
  create(@Body() dto: CreateSubDevelopmentDto, @Req() req: RequestWithUser) {
    return this.service.create(dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('import')
  @UseInterceptors(FileInterceptor('file', multerOptionsForXlxs))
  import(@UploadedFile() file: UploadedFileType, @Req() req: RequestWithUser) {
    return this.service.import(file.path, req.user.userId);
  }

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
    @Query() filter: SubDevelopmentFilterInput,
    @Query('populate') populate?: string,
    @Query('fields') fields?: string,
  ) {
    console.log(filter);
    return this.service.findAll(
      +page,
      +limit,
      sortBy,
      sortOrder,
      filter,
      populate,
      fields,
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  } 

    @Get('customerDetails/:id')
  @ApiOperation({ summary: 'Get inventory unit with customer details' })
  @ApiParam({ name: 'id', description: 'Inventory unit ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory unit with customer details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Inventory unit not found' })
  async findOneWithCustomers(@Param('id') id: string) {
    try {
      const result = await this.service.findOneWithCustomers(id);
      
      return {
        success: true,
        message: 'Inventory unit with customers retrieved successfully',
        data: {
          inventory: result.inventory,
          currentCustomers: result.currentCustomers,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
