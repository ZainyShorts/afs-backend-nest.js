import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Project, ProjectDocument } from './schema/project.schema';
import { Model } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectFilterInput } from './dto/project-filter.input';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    try {
      // Check if project with the same name already exists
      const existingProject = await this.projectModel.findOne({
        projectName: createProjectDto.projectName,
      });
      if (existingProject) {
        throw new ConflictException('Project name already exists');
      }

      // Create new project
      const createdProject = new this.projectModel(createProjectDto);
      return await createdProject.save();
    } catch (error) {
      if (error?.response?.statusCode == 409) {
        throw new ConflictException(error.response.message);
      }
      // You can customize error handling further if needed
      throw new InternalServerErrorException(
        error.message || 'Failed to create project',
      );
    }
  }

  async findAll(
    filter?: ProjectFilterInput,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    populate?: string,
  ): Promise<any> {
    try {
      const query: any = {};

      if (filter) {
        if (filter.propertyType) {
          query.propertyType = filter.propertyType;
        }

        if (filter.projectName) {
          query.projectName = { $regex: new RegExp(filter.projectName, 'i') };
        }

        if (filter.projectQuality) {
          query.projectQuality = filter.projectQuality;
        }

        if (filter.constructionStatus !== undefined) {
          query.constructionStatus = filter.constructionStatus;
        }

        if (filter.facilityCategories?.length > 0) {
          query.facilityCategories = { $in: filter.facilityCategories };
        }

        if (filter.amenitiesCategories?.length > 0) {
          query.amenitiesCategories = { $in: filter.amenitiesCategories };
        }

        if (filter.startDate || filter.endDate) {
          query.createdAt = {};
          if (filter.startDate) {
            query.createdAt.$gte = new Date(filter.startDate);
          }
          if (filter.endDate) {
            query.createdAt.$lte = new Date(filter.endDate);
          }
        }
      }

      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      const totalCount =
        Object.keys(query).length > 0
          ? await this.projectModel.countDocuments(query)
          : await this.projectModel.estimatedDocumentCount();

      // Parse 'populate' query parameter to allow for multiple population
      let populateFields = [];
      if (populate) {
        populateFields = populate.split(',').map((field) => field.trim());
      }

      const data = await this.projectModel
        .find(query)
        .populate(populateFields)
        .sort({ [sortBy]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      return {
        data,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        pageNumber: page,
      };
    } catch (error) {
      console.error('Error fetching Projects:', error);
      throw new InternalServerErrorException(
        error?.message || 'An error occurred while fetching Projects.',
      );
    }
  }

  async findOne(id: string, populateFields?: string[]): Promise<Project> {
    try {
      let query = this.projectModel.findById(id);

      // Dynamically populate if fields are provided
      if (populateFields && populateFields.length > 0) {
        populateFields.forEach((field) => {
          query = query.populate(field);
        });
      }

      const project = await query.exec();

      if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }

      return project;
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to find project',
      );
    }
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    try {
      const project = await this.projectModel.findById(id);

      if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }

      if (
        updateProjectDto.projectName &&
        updateProjectDto.projectName != project.projectName
      ) {
        const exists = await this.projectModel.findOne({
          developmentName: updateProjectDto.projectName,
        });
        if (exists) {
          throw new ConflictException(
            'A record with the same Project Name already exists.',
          );
        }
      }

      // If projectName is being updated, check for uniqueness
      if (
        updateProjectDto.projectName &&
        updateProjectDto.projectName !== project.projectName
      ) {
        const existing = await this.projectModel.findOne({
          projectName: updateProjectDto.projectName,
        });
        if (existing) {
          throw new ConflictException(
            `Project name "${updateProjectDto.projectName}" already exists`,
          );
        }
      }

      Object.assign(project, updateProjectDto); // Merge updates into the existing project
      return await project.save();
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to update project',
      );
    }
  }
}
