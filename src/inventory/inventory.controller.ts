import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ResponseDto } from 'src/dto/response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  multerOptionsForXlxs,
  UploadedFileType,
} from 'utils/multer/multer.config';
import { InventoryFilterInput } from './dto/inventoryFilterInput';
import { CreateInventorytDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Inventory } from './schema/inventory.schema';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  async addSingleRecord(@Body() dto: CreateInventorytDto) {
    return this.inventoryService.create(dto);
  }

  @Get()
  async findAll(
    @Query() filter?: InventoryFilterInput,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
    @Query('populate') populate?: string,
  ) {
    return this.inventoryService.findAll(
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
      populate,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Inventory> {
    return await this.inventoryService.findOne(id);
  }

  @Delete(':id')
  async deleteProperty(@Param('id') id: string) {
    return this.inventoryService.delete(id);
  }

  @Patch(':id')
  async updateProperty(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateProperty(id, updatePropertyDto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', multerOptionsForXlxs))
  async uploadFile(
    @UploadedFile() file: UploadedFileType,
  ): Promise<ResponseDto> {
    return this.inventoryService.import(file.path);
  }
}
