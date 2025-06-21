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
  UseGuards,
  Req,
} from '@nestjs/common';
import { CreateMasterDevelopmentDto } from './dto/create-master-development.dto';
import { MasterDevelopmentService } from './masterdevelopment.service';
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
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Patch('updateSingleRecord/:id')
  update(@Param('id') id: string, @Body() dto: CreateMasterDevelopmentDto) {
    return this.service.update(id, dto);
  }

  @Get('report/:id')
  report(@Param('id') id: string) {
    return this.service.report(id);
  }
}
