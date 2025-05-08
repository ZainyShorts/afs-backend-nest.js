import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AddPropertyDto } from './input/addPropertyInput';
import { PropertyService } from './property.service';
import { ResponseDto } from 'src/dto/response.dto';
import { UpdatePropertyDto } from './input/updatePropertyInput';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  multerOptionsForXlxs,
  UploadedFileType,
} from 'utils/multer/multer.config';
import { PropertyFilterInput } from './input/propertyFilterInput';
import { PaginatedProperties } from './output/properties.dto';
import { Property } from './schema/property.schema';

@Controller('property')
export class PropertyController {
  constructor(private readonly prropertyService: PropertyService) {}

  @Get('')
  async getProperties(
    @Query('filter') filter?: PropertyFilterInput,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
  ): Promise<PaginatedProperties> {
    return this.prropertyService.getProperties(
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }

  @Get(':docId')
  async getProperty(@Param('docId') docId: string): Promise<Property> {
    return this.prropertyService.getSingleRecord(docId);
  }

  @Post('addSingleRecord')
  async addSingleRecord(@Body() data: AddPropertyDto) {
    return this.prropertyService.addSingleRecord(data);
  }

  @Delete(':id')
  async deleteProperty(@Param('id') id: string): Promise<ResponseDto> {
    return this.prropertyService.deleteSingleRecord(id);
  }

  @Put('updateSingleRecord')
  async updateProperty(@Body() updatePropertyDto: UpdatePropertyDto) {
    return this.prropertyService.updateProperty(updatePropertyDto);
  }

  @Post('updateBulkRecord')
  @UseInterceptors(FileInterceptor('file', multerOptionsForXlxs))
  async uploadFile(
    @UploadedFile() file: UploadedFileType,
    @Body() data: any,
  ): Promise<ResponseDto> {
    return this.prropertyService.readXlsxAndInsert(file.path, data.clerkId);
  }
}
