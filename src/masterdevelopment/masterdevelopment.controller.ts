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
  UploadedFile,
} from '@nestjs/common';
import { CreateMasterDevelopmentDto } from './dto/create-master-development.dto';
import { MasterDevelopmentService } from './masterdevelopment.service';
import { MasterDevelopmentFilterInput } from './dto/MasterDevelopmentFilterInput';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  multerOptionsForXlxs,
  UploadedFileType,
} from 'utils/multer/multer.config';

@Controller('masterDevelopment')
export class MasterDevelopmentController {
  constructor(private readonly service: MasterDevelopmentService) {}

  @Post('addSingleRecord')
  create(@Body() dto: CreateMasterDevelopmentDto) {
    return this.service.create(dto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', multerOptionsForXlxs))
  import(@UploadedFile() file: UploadedFileType) {
    return this.service.importExcelFile(file.path);
  }

  @Get()
  findAll(
    @Query() filter: MasterDevelopmentFilterInput,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
  ) {
    return this.service.findAll(filter, +page, +limit, sortBy, sortOrder);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Patch('updateSingleRecord/:id')
  update(@Param('id') id: string, @Body() dto: CreateMasterDevelopmentDto) {
    return this.service.update(id, dto);
  }
}
