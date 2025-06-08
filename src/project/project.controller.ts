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
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './schema/project.schema';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectFilterInput } from './dto/project-filter.input';

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
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
