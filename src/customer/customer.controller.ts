import {
  Body,
  Controller,
  Post, 
  Res,
  Req, 
  Get, 
  BadRequestException,
  UseGuards, 
  UseInterceptors, 
  Delete,
  HttpStatus, 
  Put,  
  HttpException, 
  UploadedFile,
  Param,
  HttpCode, 
  Query
} from '@nestjs/common';
import { CustomerService } from './customer.service'; 
import { RequestWithUser } from 'utils/interface/interfaces';
import { CustomerDTO } from './dto/addCustomer.dto';    
import { FileInterceptor } from '@nestjs/platform-express'; 
import { Response } from 'express'; 
import { Roles } from 'src/auth/roles.decorator';
import { FilterCustomerDTO } from './dto/customerFilters.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CustomerDTO, @Req() req: RequestWithUser) {
    try {

      const result = await this.customerService.create(dto, req.user.userId);

      return {
        message: 'Customer created successfully',
        data: result,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Failed to create customer',
        error: error.message,
      };
    }
  }  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
async findAll(
    @Query() filterDto: FilterCustomerDTO,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
  ) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.max(parseInt(limit, 10) || 10, 1);

    if (!['asc', 'desc'].includes(sortOrder.toLowerCase())) {
      throw new HttpException(
        'Invalid sortOrder. Allowed values: asc or desc',
        HttpStatus.BAD_REQUEST,
      );
    }

    const { data, total } = await this.customerService.findAll(
      filterDto,
      pageNum,
      limitNum, 
      sortBy,
      sortOrder as 'asc' | 'desc',
    );

    return {
      message: 'Customers fetched successfully',
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        sortBy,
        sortOrder,
        totalPages: Math.ceil(total / limitNum),
      },
      data,
    };
  }
   @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: CustomerDTO, @Req() req: RequestWithUser) {
    const userId = req.user['id'];
    const updated = await this.customerService.update(id, dto, userId);

    return {
      message: 'Customer updated successfully',
      data: updated,
    };
  } 
  @UseGuards(JwtAuthGuard)
@Get(':id')
async findOne(@Param('id') id: string) {
  const customer = await this.customerService.findById(id);

  return {
    message: 'Customer fetched successfully',
    data: customer,
  };
}  

  @Post('import')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 }, 
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
          return cb(
            new BadRequestException('Only Excel or CSV files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async importCustomers(
  @UploadedFile() file: Express.Multer.File,
  @Req() req: any,
  @Res() res: Response,
) {
  if (!file) {
    throw new BadRequestException('File is required');
  }

  try {
    const result = await this.customerService.importCustomers(file.buffer, req.user.id);
    return res.status(200).json(result); // ✅ Only send 200 if file was valid
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message || 'Server Error' });
  }
} 

 @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.customerService.deleteCustomer(id);
  }



}
