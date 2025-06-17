import {
  BadRequestException,
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
  Req,
  UploadedFile,
  UseGuards,
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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RequestWithUser } from 'utils/interface/interfaces';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async addSingleRecord(
    @Body() dto: CreateInventorytDto,
    @Req() req: RequestWithUser,
  ) {
    console.log('innve', req.user.userId);
    return this.inventoryService.create(dto, req.user.userId);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
    @Query() filter?: InventoryFilterInput,
    @Query('populate') populate?: string,
  ) {
    return this.inventoryService.findAll(
      page,
      limit,
      sortBy,
      sortOrder,
      filter,
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

  @UseGuards(JwtAuthGuard)
  @Post('import')
  @UseInterceptors(FileInterceptor('file', multerOptionsForXlxs))
  async uploadFile(
    @UploadedFile() file: UploadedFileType,
    @Req() req: RequestWithUser,
  ): Promise<ResponseDto> {
    console.log('import');
    return this.inventoryService.import(file.path, req.user.userId);
  }

  @Delete('plan')
  async deletePlan(@Body() body: any) {
    const { docId, type } = body;
    if (!docId || !type) {
      throw new BadRequestException('docId and type are required');
    }
    return this.inventoryService.deletePlan(docId, type);
  }

  @Post('plan')
  async addPlan(@Body() body: any) {
    const { docId, type, data } = body;
    if (!docId || !type || !data) {
      throw new BadRequestException('docId, type and data are required');
    }
    return this.inventoryService.addPlan(docId, type, data);
  }
}
