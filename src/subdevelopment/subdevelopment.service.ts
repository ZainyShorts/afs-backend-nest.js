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
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { SubDevelopmentheaderMapping } from 'utils/methods/methods';
import { MasterDevelopmentService } from 'src/masterdevelopment/masterdevelopment.service';

@Injectable()
export class SubDevelopmentService {
  constructor(
    @InjectModel(SubDevelopment.name)
    private readonly subDevelopmentModel: Model<SubDevelopment>,
    private readonly masterDevelopmentService: MasterDevelopmentService,
  ) {}

  async create(dto: CreateSubDevelopmentDto): Promise<SubDevelopment> {
    try {
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
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filter?: SubDevelopmentFilterInput,
    populate?: string,
    fields?: string,
  ): Promise<any> {
    try {
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

        if (filter.plotPermission?.length > 0) {
          query.plotPermission = { $in: filter.plotPermission };
        }

        if (filter.facilitiesCategories?.length > 0) {
          query.facilitiesCategories = { $in: filter.facilitiesCategories };
        }

        if (filter.amentiesCategories?.length > 0) {
          query.amentiesCategories = { $in: filter.amentiesCategories };
        }

        if (filter.startDate || filter.endDate) {
          query.createdAt = {};
          if (filter.startDate)
            query.createdAt.$gte = new Date(filter.startDate);
          if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
        }
      }

      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      const totalCount =
        Object.keys(query).length > 0
          ? await this.subDevelopmentModel.countDocuments(query)
          : await this.subDevelopmentModel.estimatedDocumentCount();

      const projection = fields ? fields.split(',').join(' ') : '';
      const data = await this.subDevelopmentModel
        .find(query)
        .select(projection)
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
    } catch (error) {
      console.error('Error fetching SubDevelopments:', error);
      throw new InternalServerErrorException(
        error?.message || 'An error occurred while fetching SubDevelopments.',
      );
    }
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

  async remove(id: string): Promise<any> {
    try {
      const result = await this.subDevelopmentModel
        .findByIdAndDelete(id)
        .exec();
      if (!result) {
        throw new NotFoundException(`SubDevelopment with id ${id} not found`);
      }
      return {
        success: true,
        message: `SubDevelopment with id ${id} has been deleted.`,
      };
    } catch (error) {
      console.error('Error deleting SubDevelopment:', error);
      throw new InternalServerErrorException(
        error?.message || 'An error occurred while deleting SubDevelopment.',
      );
    }
  }

  async import(filePath: string): Promise<any> {
    // try {
    //   const fileBuffer = fs.readFileSync(filePath);
    //   const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    //   const sheetName = workbook.SheetNames[0];
    //   const sheet = workbook.Sheets[sheetName];
    //   const jsonData = XLSX.utils.sheet_to_json(sheet);

    //   const formattedData: any = jsonData.map((row: any) => {
    //     const formattedRow: any = {};
    //     for (const key in row) {
    //       const cleanedKey = key.replace(/\n/g, '').trim();
    //       const mappedKey = SubDevelopmentheaderMapping[cleanedKey];
    //       if (mappedKey) {
    //         formattedRow[mappedKey] = row[key];
    //       }
    //     }

    //     formattedRow['totalAreaSqFt'] =
    //       (formattedRow.buaAreaSqFt || 0) +
    //       (formattedRow.facilitiesAreaSqFt || 0) +
    //       (formattedRow.amentiesAreaSqFt || 0);

    //     const plotPermissionList: string[] = [];

    //     if (formattedRow?.plotPermission1) {
    //       plotPermissionList.push(formattedRow.plotPermission1);
    //       delete formattedRow.plotPermission1;
    //     }

    //     if (formattedRow?.plotPermission2) {
    //       plotPermissionList.push(formattedRow.plotPermission2);
    //       delete formattedRow.plotPermission2;
    //     }

    //     if (formattedRow?.plotPermission3) {
    //       plotPermissionList.push(formattedRow.plotPermission3);
    //       delete formattedRow.plotPermission3;
    //     }

    //     if (formattedRow?.plotPermission4) {
    //       plotPermissionList.push(formattedRow.plotPermission4);
    //       delete formattedRow.plotPermission4;
    //     }

    //     if (formattedRow?.plotPermission5) {
    //       plotPermissionList.push(formattedRow.plotPermission5);
    //       delete formattedRow.plotPermission5;
    //     }

    //     formattedRow['plotPermission'] = plotPermissionList;

    //     return formattedRow;
    //   });

    //   const requiredFields = [
    //     'developmentName',
    //     'subDevelopment',
    //     'plotNumber',
    //     'plotHeight',
    //     'plotSizeSqFt',
    //     'plotBUASqFt',
    //     'plotStatus',
    //     'plotPermission',
    //     'buaAreaSqFt',
    //     'facilitiesAreaSqFt',
    //     'amentiesAreaSqFt',
    //     'totalAreaSqFt',
    //   ];

    //   for(let i=0; i<formattedData.length;i++){
    //       if (!formattedData[i][field]) {
    //       return {
    //         success: false,
    //         message: `Missing or invalid value of ${field} row: ${index}`,
    //       };
    //     }
    //   }

    //   for (const field of requiredFields) {
    //     if (!formattedData[field]) {
    //       return {
    //         success: false,
    //         message: `Missing or invalid value of ${field} row: ${index}`,
    //       };
    //     }
    //   }
    //   return formattedData;


    //   const developmentList =
    //     await this.masterDevelopmentService.getAllMasterDevelopment([
    //       '_id',
    //       'developmentName',
    //     ]);

    //   if (formattedData.length === 0) {
    //     // No new data to insert
    //     fs.unlinkSync(filePath);
    //     return {
    //       success: true,
    //       totalEntries: jsonData.length,
    //       insertedEntries: 0,
    //       skippedDuplicateEntires: 0,
    //     };
    //   }

    //   const chunkSize = 5000;
    //   let insertedDataCount = 0;

    //   for (let i = 0; i < formattedData.length; i += chunkSize) {
    //     const chunk = formattedData.slice(i, i + chunkSize);

    //     if (chunk.length === 0) continue;

    //     try {
    //       await this.subDevelopmentModel.insertMany(chunk, {
    //         ordered: false,
    //       });
    //       insertedDataCount += chunk.length;
    //     } catch (error) {
    //       console.error(`Error inserting chunk starting at index ${i}:`, error);
    //     }
    //   }

    //   fs.unlinkSync(filePath);

    //   return {
    //     success: true,
    //     totalEntries: jsonData.length,
    //     insertedEntries: insertedDataCount,
    //     skippedDuplicateEntires: 0,
    //   };
    // } catch (error) {
    //   if (fs.existsSync(filePath)) {
    //     fs.unlinkSync(filePath);
    //   }
    //   if (error.response?.statusCode === 400) {
    //     throw new BadRequestException(
    //       'File format is not correct. Missing or empty fields.',
    //     );
    //   }
    //   throw new InternalServerErrorException(
    //     error?.response?.message || 'Internal server error occurred.',
    //   );
    // }
  }
}
