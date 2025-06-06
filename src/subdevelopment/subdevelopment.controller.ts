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
} from '@nestjs/common';
import { SubDevelopmentService } from './subdevelopment.service';
import { CreateSubDevelopmentDto } from './dto/create-sub-development.dto';
import { SubDevelopmentFilterInput } from './dto/sub-development-filter.input';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  multerOptionsForXlxs,
  UploadedFileType,
} from 'utils/multer/multer.config';

@Controller('subDevelopment')
export class SubDevelopmentController {
  constructor(private readonly service: SubDevelopmentService) {}

  @Post('addSingleRecord')
  create(@Body() dto: CreateSubDevelopmentDto) {
    return this.service.create(dto);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file', multerOptionsForXlxs))
  import(@UploadedFile() file: UploadedFileType) {
    return this.service.import(file.path);
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
