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
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filter?: ProjectFilterInput,
    populate?: string,
    fields?: string,
  ): Promise<any> {
    try {
      const query: any = {};

      if (filter) {
        // Plot filters
        // if (filter.plotNumber !== undefined) {
        //   query['plot.plotNumber'] = filter.plotNumber;
        // }

        // if (filter.plotStatus) {
        //   query['plot.plotStatus'] = filter.plotStatus;
        // }

        // if (filter.plotPermission?.length > 0) {
        //   query['plot.plotPermission'] = { $in: filter.plotPermission };
        // }

        // Other Project filters
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

        if (filter.launchDate) {
          query.launchDate = filter.launchDate;
        }

        if (filter.completionDate) {
          query.completionDate = filter.completionDate;
        }

        if (filter.uponCompletion) {
          query.uponCompletion = filter.uponCompletion;
        }

        if (filter.installmentDate) {
          query.installmentDate = filter.installmentDate;
        }

        if (filter.postHandOver) {
          query.postHandOver = filter.postHandOver;
        }

        if (filter.salesStatus) {
          query.salesStatus = filter.salesStatus;
        }

        if (filter.percentOfConstruction) {
          query.percentOfConstruction = filter.percentOfConstruction;
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

      let populateFields = [];
      if (populate) {
        populateFields = populate.split(',').map((field) => field.trim());
      }
      const projection = fields ? fields.split(',').join(' ') : '';
      let data = await this.projectModel
        .find(query)
        .select(projection)
        .populate(populateFields)
        .sort({ [sortBy]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      if (filter.masterDevelopment) {
        data = data.filter((item) => {
          const regex = new RegExp(filter.masterDevelopment, 'i');
          return regex.test(item.masterDevelopment?.developmentName || '');
        });
      }

      if (filter.subDevelopment) {
        populateFields.push('subDevelopment');
        data = data.filter((item) => {
          const regex = new RegExp(filter.subDevelopment, 'i');
          return regex.test(item.subDevelopment?.subDevelopment || '');
        });

        console.log('before');

        console.log(data);

        // Scenario 2: Further filtering by plot details within subDevelopment
        // data = data.filter((item) => {
        //   const subDevPlot = item.subDevelopment;
        //   if (!subDevPlot) return true;

        //   console.log(subDevPlot);

        //   if (
        //     filter.plotNumber !== undefined &&
        //     subDevPlot.plotNumber !== filter.plotNumber
        //   )
        //     return false;
        //   if (filter.plotStatus && subDevPlot.plotStatus !== filter.plotStatus)
        //     return false;
        //   if (
        //     filter.plotPermission?.length > 0 &&
        //     !subDevPlot.plotPermission.some((permission) =>
        //       filter.plotPermission.includes(permission),
        //     )
        //   )
        //     return false;

        //   return true;
        // });
      }

      console.log(data);

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
