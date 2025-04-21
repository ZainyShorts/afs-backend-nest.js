import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubDevelopment } from './schema/subdevelopment.schema';
import { CreateSubDevelopmentDto } from './dto/create-sub-development.dto';
import { SubDevelopmentFilterInput } from './dto/sub-development-filter.input';
import { UpdateSubDevelopmentDto } from './dto/update-sub-development.dto';
import {
  AmenitiesCategory,
  FacilitiesCategory,
  PlotStatus,
} from 'utils/enum/enums';

@Injectable()
export class SubDevelopmentService {
  constructor(
    @InjectModel(SubDevelopment.name)
    private readonly subDevelopmentModel: Model<SubDevelopment>,
  ) {}

  async create(dto: CreateSubDevelopmentDto): Promise<SubDevelopment> {
    try {
      // Check for duplicate subDevelopment name
      const duplicate = await this.subDevelopmentModel.findOne({
        subDevelopment: dto.subDevelopment,
        plotNumber: dto.plotNumber,
      });

      if (duplicate) {
        throw new BadRequestException(
          'A record with the same SubDevelopment and Plot Number already exists.',
        );
      }

      // Optional validation (can be enum based if needed)
      if (dto.facilitiesCategories) {
        for (const facility of dto.facilitiesCategories) {
          if (typeof facility !== 'string') {
            throw new BadRequestException(
              `Invalid facility category: ${facility}`,
            );
          }
        }
      }

      if (dto.amentiesCategories) {
        for (const amenity of dto.amentiesCategories) {
          if (typeof amenity !== 'string') {
            throw new BadRequestException(
              `Invalid amenity category: ${amenity}`,
            );
          }
        }
      }

      const created = new this.subDevelopmentModel(dto);
      return await created.save();
    } catch (error) {
      console.log(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.response.statusCode === 400) {
        throw new BadRequestException(error.response.message);
      }
      throw new BadRequestException(
        'Failed to create sub development. Check your input.',
      );
    }
  }

  async findAll(
    filter?: SubDevelopmentFilterInput,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    populate?: string,
  ) {
    const query: any = {};

    if (filter) {
      if (filter.subDevelopment) {
        query.subDevelopment = {
          $regex: new RegExp(filter.subDevelopment, 'i'),
        };
      }

      if (filter.plotNumber !== undefined) {
        query.plotNumber = filter.plotNumber;
      }

      if (filter.plotPermission) {
        query.plotPermission = filter.plotPermission;
      }

      if (filter.plotStatus) {
        query.plotStatus = filter.plotStatus;
      }

      if (filter.buaAreaSqFtRange) {
        query.buaAreaSqFt = {};
        if (filter.buaAreaSqFtRange.min !== undefined)
          query.buaAreaSqFt.$gte = filter.buaAreaSqFtRange.min;
        if (filter.buaAreaSqFtRange.max !== undefined)
          query.buaAreaSqFt.$lte = filter.buaAreaSqFtRange.max;
      }

      if (filter.totalSizeSqFtRange) {
        query.totalSizeSqFt = {};
        if (filter.totalSizeSqFtRange.min !== undefined)
          query.totalSizeSqFt.$gte = filter.totalSizeSqFtRange.min;
        if (filter.totalSizeSqFtRange.max !== undefined)
          query.totalSizeSqFt.$lte = filter.totalSizeSqFtRange.max;
      }

      if (filter.facilitiesCategories?.length > 0) {
        query.facilitiesCategories = { $in: filter.facilitiesCategories };
      }

      if (filter.amentiesCategories?.length > 0) {
        query.amentiesCategories = { $in: filter.amentiesCategories };
      }

      if (filter.startDate || filter.endDate) {
        query.createdAt = {};
        if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
        if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
      }
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const totalCount =
      Object.keys(query).length > 0
        ? await this.subDevelopmentModel.countDocuments(query)
        : await this.subDevelopmentModel.estimatedDocumentCount();

    const data = await this.subDevelopmentModel
      .find(query)
      .populate(populate) // If you want to populate
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
  }
  async findOne(id: string, populate?: string) {
    try {
      const result = await this.subDevelopmentModel
        .findById(id)
        .populate(populate)
        .exec();
      if (!result) {
        throw new NotFoundException('SubDevelopment not found');
      }
      return result;
    } catch (error) {
      throw new Error(`Failed to fetch SubDevelopment: ${error.message}`);
    }
  }

  async update(id: string, dto: UpdateSubDevelopmentDto) {
    try {
      const dev = await this.subDevelopmentModel.findById(id);
      if (dto.subDevelopment && dto.subDevelopment != dev.subDevelopment) {
        const exists = await this.subDevelopmentModel.findOne({
          subDevelopment: dto.subDevelopment,
        });
        if (exists) {
          throw new BadRequestException(
            'A record with the same Sub-Development Name already exists.',
          );
        }
      }
      if (
        dto.plotStatus &&
        !Object.values(PlotStatus).includes(dto.plotStatus as PlotStatus)
      ) {
        throw new BadRequestException(`Invalid locationQuality.`);
      }

      if (dto.facilitiesCategories) {
        for (const facility of dto.facilitiesCategories) {
          if (
            !Object.values(FacilitiesCategory).includes(
              facility as FacilitiesCategory,
            )
          ) {
            throw new BadRequestException(
              `Invalid facility category: ${facility}.`,
            );
          }
        }
      }

      if (dto.amentiesCategories) {
        for (const amenity of dto.amentiesCategories) {
          if (
            !Object.values(AmenitiesCategory).includes(
              amenity as AmenitiesCategory,
            )
          ) {
            throw new BadRequestException(
              `Invalid amenity category: ${amenity}.`,
            );
          }
        }
      }

      const updated = await this.subDevelopmentModel
        .findByIdAndUpdate(id, dto, { new: true })
        .exec();
      if (!updated) {
        throw new NotFoundException('SubDevelopment not found');
      }
      return updated;
    } catch (error) {
      if (error.response.statusCode == 400)
        throw new BadRequestException(
          `A record with the same Sub-Development Name already exists.`,
        );
      throw new InternalServerErrorException(`${error.message}`);
    }
  }

  remove(id: string) {
    return this.subDevelopmentModel.findByIdAndDelete(id).exec();
  }
}
