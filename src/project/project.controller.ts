// src/project/project.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './schema/project.schema';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectFilterInput } from './dto/project-filter.input';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  multerOptionsForXlxs,
  UploadedFileType,
} from 'utils/multer/multer.config';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RequestWithUser } from 'utils/interface/interfaces';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: RequestWithUser,
  ) {
    return this.projectService.create(createProjectDto, req.user.userId);
  }

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('sortOrder') sortOrder = 'desc',
    @Query() filter: ProjectFilterInput,
    @Query('populate') populate?: string,
    @Query('fields') fields?: string,
  ) {
    return this.projectService.findAll(
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
  async findOne(
    @Param('id') id: string,
    @Query('populate') populate?: string,
  ): Promise<Project> {
    const populateFields = populate ? populate.split(',') : [];
    return await this.projectService.findOne(id, populateFields);
  }

  @UseGuards(JwtAuthGuard)
  @Post('import')
  @UseInterceptors(FileInterceptor('file', multerOptionsForXlxs))
  import(@UploadedFile() file: UploadedFileType, @Req() req: RequestWithUser) {
    // console.log(req.user.userId);
    return this.projectService.importExcelFile(file.path, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    try {
      return await this.projectService.update(id, updateProjectDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof ConflictException) {
        throw new ConflictException(error.message);
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to update project',
      );
    }
  }

  @Get('report/:id')
  async report(@Param('id') id: string): Promise<any> {
    console.log(id);
    return await this.projectService.report(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.projectService.delete(id);
  }
}
