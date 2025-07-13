import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Query,
  UseInterceptors, 
  HttpException,
   HttpStatus ,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CreateMasterDevelopmentDto } from './dto/create-master-development.dto';
import { MasterDevelopmentService } from './masterdevelopment.service'; 
import { ApiResponse, ApiOperation , ApiParam } from '@nestjs/swagger';
import { MasterDevelopmentFilterInput } from './dto/MasterDevelopmentFilterInput';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  multerOptionsForXlxs,
  UploadedFileType,
} from 'utils/multer/multer.config';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RequestWithUser } from 'utils/interface/interfaces';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('masterDevelopment')
export class MasterDevelopmentController {
  constructor(private readonly service: MasterDevelopmentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('addSingleRecord')
  create(@Body() dto: CreateMasterDevelopmentDto, @Req() req: RequestWithUser) {
    return this.service.create(dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('import')
  @UseInterceptors(FileInterceptor('file', multerOptionsForXlxs))
  import(@UploadedFile() file: UploadedFileType, @Req() req: RequestWithUser) {
    return this.service.importExcelFile(file.path, req.user.userId);
  }

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
    @Query() filter?: MasterDevelopmentFilterInput,
    @Query('fields') fields?: string,
  ) {
    console.log(filter);
    return this.service.findAll(
      +page,
      +limit,
      sortBy,
      sortOrder,
      filter,
      fields,
    );
  } 
  @Get(':id')
findAllById(
  @Param('id') id: string,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
  @Query('sortBy') sortBy = 'createdAt',
  @Query('sortOrder') sortOrder = 'desc',
  @Query() filter?: MasterDevelopmentFilterInput,
  @Query('fields') fields?: string,
) {
  // Add the ID to filter object (e.g. as propertyId)
  const finalFilter = {
    ...(filter || {}),
    propertyId: id, // inject propertyId
  };

  return this.service.findAll(
    +page,
    +limit,
    sortBy,
    sortOrder as 'asc' | 'desc',
    finalFilter,
    fields,
  );
}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
 

  @Delete(':masterDevelopmentId/customers/:customerId')
  async removeCustomerFromMasterDevelopment(
    @Param('masterDevelopmentId') masterDevelopmentId: string,
    @Param('customerId') customerId: string,
  ) {
    try {
      const updatedDevelopment = await this.service.removeCustomer(
        masterDevelopmentId,
        customerId,
      );
      return {
        message: 'Customer removed successfully',
        data: updatedDevelopment,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to remove customer',
        HttpStatus.BAD_REQUEST,
      );
    }
  } 

  @Post(':masterDevelopmentId/customers/:customerId')
  async addCustomerToMasterDevelopment(
    @Param('masterDevelopmentId') masterDevelopmentId: string,
    @Param('customerId') customerId: string,
  ) {
    try {
      const updatedDevelopment =
        await this.service.addCustomer(
          masterDevelopmentId,
          customerId,
        );
      return {
        message: 'Customer added successfully',
        data: updatedDevelopment,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add customer',
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  @Patch('updateSingleRecord/:id')
  update(@Param('id') id: string, @Body() dto: CreateMasterDevelopmentDto) {
    return this.service.update(id, dto);
  }

  @Get('report/:id')
  report(@Param('id') id: string) {
    return this.service.report(id);
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
