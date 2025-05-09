import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMasterDevelopmentDto } from './dto/create-master-development.dto';
import { MasterDevelopment } from './schema/master-development.schema';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import {
  AmenitiesCategory,
  FacilitiesCategory,
  LocationQuality,
} from 'utils/enum/enums';
import { UpdateMasterDevelopmentDto } from './dto/update-master-development.dto';
import { MasterDevelopmentFilterInput } from './dto/MasterDevelopmentFilterInput';
import { MasterDevelopmentheaderMapping } from 'utils/methods/methods';

@Injectable()
export class MasterDevelopmentService {
  constructor(
    @InjectModel(MasterDevelopment.name)
    private readonly MasterDevelopmentModel: Model<MasterDevelopment>,
  ) {}

  async create(dto: CreateMasterDevelopmentDto): Promise<MasterDevelopment> {
    try {
      const duplicate = await this.MasterDevelopmentModel.findOne({
        developmentName: dto.developmentName,
      });

      if (duplicate) {
        throw new BadRequestException(
          'A record with the same Development Name already exists.',
        );
      }

      if (
        !Object.values(LocationQuality).includes(
          dto.locationQuality as LocationQuality,
        )
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

      const created = new this.MasterDevelopmentModel(dto);
      return await created.save();
    } catch (error) {
      if (error.response.statusCode == 400) {
        throw new BadRequestException(
          'Failed to create master development. Check your input.',
        );
      }
      // Throw Internal Server Error
      throw new InternalServerErrorException(
        error?.response?.message || 'Internal server error occurred.',
      );
    }
  }

  async findAll(
    filter?: MasterDevelopmentFilterInput,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  ) {
    try {
      const query: any = {};

      if (filter) {
        if (filter.developmentName) {
          query.developmentName = {
            $regex: new RegExp(filter.developmentName, 'i'),
          };
        }
        if (filter.roadLocation) {
          query.roadLocation = { $regex: new RegExp(filter.roadLocation, 'i') };
        }
        if (filter.country) {
          query.country = { $regex: new RegExp(filter.country, 'i') };
        }
        if (filter.city) {
          query.city = { $regex: new RegExp(filter.city, 'i') };
        }
        if (filter.locationQuality) {
          query.locationQuality = filter.locationQuality;
        }
        if (filter.buaAreaSqFtRange) {
          query.buaAreaSqFt = {};
          if (filter.buaAreaSqFtRange.min !== undefined)
            query.buaAreaSqFt.$gte = filter.buaAreaSqFtRange.min;
          if (filter.buaAreaSqFtRange.max !== undefined)
            query.buaAreaSqFt.$lte = filter.buaAreaSqFtRange.max;
        }
        if (filter.totalAreaSqFtRange) {
          query.totalAreaSqFt = {};
          if (filter.totalAreaSqFtRange.min !== undefined)
            query.totalAreaSqFt.$gte = filter.totalAreaSqFtRange.min;
          if (filter.totalAreaSqFtRange.max !== undefined)
            query.totalAreaSqFt.$lte = filter.totalAreaSqFtRange.max;
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
          ? await this.MasterDevelopmentModel.countDocuments(query)
          : await this.MasterDevelopmentModel.estimatedDocumentCount();

      const data = await this.MasterDevelopmentModel.find(query)
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
      console.error('Error fetching MasterDevelopments:', error);
      throw new Error('Failed to fetch MasterDevelopments.');
    }
  }

  private validateEntry(dto: any): boolean {
    // Check if the locationQuality is valid
    if (
      !Object.values(LocationQuality).includes(
        dto.locationQuality as LocationQuality,
      )
    ) {
      console.log(`Invalid locationQuality: ${dto.locationQuality}`);
      return false;
    }

    // Check if the facilitiesCategories are valid
    if (dto.facilitiesCategories) {
      for (const facility of dto.facilitiesCategories) {
        if (
          !Object.values(FacilitiesCategory).includes(
            facility as FacilitiesCategory,
          )
        ) {
          console.log(`Invalid facility category: ${facility}`);
          return false;
        }
      }
    }

    // Check if the amentiesCategories are valid
    if (dto.amentiesCategories) {
      for (const amenity of dto.amentiesCategories) {
        if (
          !Object.values(AmenitiesCategory).includes(
            amenity as AmenitiesCategory,
          )
        ) {
          console.log(`Invalid amenity category: ${amenity}`);
          return false;
        }
      }
    }

    // If all checks pass, the entry is valid
    return true;
  }

  async findOne(id: string): Promise<MasterDevelopment> {
    try {
      const development = await this.MasterDevelopmentModel.findById(id).exec();
      return development;
    } catch (error) {
      console.error('Error finding MasterDevelopment by ID:', error);
      throw new Error('Failed to find MasterDevelopment');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.MasterDevelopmentModel.findByIdAndDelete(id).exec();
    } catch (error) {
      console.error('Error deleting MasterDevelopment by ID:', error);
      throw new Error('Failed to delete MasterDevelopment');
    }
  }

  async update(
    id: string,
    dto: UpdateMasterDevelopmentDto,
  ): Promise<MasterDevelopment> {
    try {
      const dev = await this.MasterDevelopmentModel.findById(id);
      if (!dev) {
        throw new BadRequestException('MasterDevelopment not found.');
      }

      if (dto.developmentName && dto.developmentName != dev.developmentName) {
        const exists = await this.MasterDevelopmentModel.findOne({
          developmentName: dto.developmentName,
        });
        if (exists) {
          throw new BadRequestException(
            'A record with the same Development Name already exists.',
          );
        }
      }

      if (
        dto.locationQuality &&
        !Object.values(LocationQuality).includes(
          dto.locationQuality as LocationQuality,
        )
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

      return await this.MasterDevelopmentModel.findByIdAndUpdate(id, dto, {
        new: true,
      }).exec();
    } catch (error) {
      console.error('Error updating MasterDevelopment:', error);
      throw new BadRequestException('Failed to update MasterDevelopment.');
    }
  }

  async importExcelFile(filePath: string): Promise<any> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const formattedData = jsonData.map((row: any) => {
        const formattedRow: any = {};
        for (const key in row) {
          const cleanedKey = key.replace(/\n/g, '').trim();
          const mappedKey = MasterDevelopmentheaderMapping[cleanedKey];
          if (mappedKey) {
            formattedRow[mappedKey] = row[key];
          }
        }

        formattedRow.totalAreaSqFt =
          (formattedRow.buaAreaSqFt || 0) +
          (formattedRow.facilitiesAreaSqFt || 0) +
          (formattedRow.amentiesAreaSqFt || 0);

        const requiredFields = [
          'country',
          'city',
          'roadLocation',
          'developmentName',
          'locationQuality',
          'buaAreaSqFt',
          'facilitiesAreaSqFt',
          'amentiesAreaSqFt',
          'totalAreaSqFt',
        ];

        for (const field of requiredFields) {
          if (!formattedRow[field] || formattedRow[field] === 0) {
            console.log(`Missing or empty field: ${field}`);
            throw new BadRequestException(
              'File format is not correct. Missing or empty fields.',
            );
          }
        }

        return formattedRow;
      });

      // === Pre-check: Fetch existing developmentNames in one query ===
      const allDevelopmentNames = formattedData.map(
        (row) => row.developmentName,
      );

      const existingDevelopments = await this.MasterDevelopmentModel.find(
        { developmentName: { $in: allDevelopmentNames } },
        'developmentName',
      ).lean();

      const existingNameSet = new Set(
        existingDevelopments.map((r) => r.developmentName),
      );

      // === Pre-filter: remove duplicates BEFORE inserting ===
      let duplicates = 0;
      const seenDevelopmentNames = new Set();

      const filteredData = formattedData.filter((row) => {
        if (existingNameSet.has(row.developmentName)) {
          // Duplicate because it exists in DB
          duplicates++;
          return false;
        }

        if (seenDevelopmentNames.has(row.developmentName)) {
          // Duplicate inside uploaded file
          duplicates++;
          return false;
        }

        // If not seen, add to seen set
        seenDevelopmentNames.add(row.developmentName);
        return true; // Keep this one
      });

      if (filteredData.length === 0) {
        // No new data to insert
        fs.unlinkSync(filePath);
        return {
          success: true,
          totalEntries: jsonData.length,
          insertedEntries: 0,
          skippedDuplicateEntires: existingDevelopments.length + duplicates,
        };
      }

      // Deduplicate in-memory (optional if needed)
      const uniqueRecords = new Map();
      filteredData.forEach((dto) => {
        if (this.validateEntry(dto)) {
          uniqueRecords.set(dto.developmentName, dto);
        }
      });

      const bulkInsertData = Array.from(uniqueRecords.values());

      const chunkSize = 5000;
      let insertedDataCount = 0;

      for (let i = 0; i < bulkInsertData.length; i += chunkSize) {
        const chunk = bulkInsertData.slice(i, i + chunkSize);

        if (chunk.length === 0) continue;

        try {
          await this.MasterDevelopmentModel.insertMany(chunk, {
            ordered: false,
          });
          insertedDataCount += chunk.length;
        } catch (error) {
          console.error(`Error inserting chunk starting at index ${i}:`, error);
        }
      }

      fs.unlinkSync(filePath);

      return {
        success: true,
        totalEntries: jsonData.length,
        insertedEntries: insertedDataCount,
        skippedDuplicateEntires: existingDevelopments.length + duplicates,
      };
    } catch (error) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      if (error.response?.statusCode === 400) {
        throw new BadRequestException(
          'File format is not correct. Missing or empty fields.',
        );
      }
      throw new InternalServerErrorException(
        error?.response?.message || 'Internal server error occurred.',
      );
    }
  }

  async getAllMasterDevelopment(
    fields: string[],
  ): Promise<MasterDevelopment[]> {
    try {
      const projection = fields.join(' ');
      const development = await this.MasterDevelopmentModel.find()
        .select(projection)
        .exec();
      return development;
    } catch (error) {
      console.error('Error finding MasterDevelopment by ID:', error);
      return [];
    }
  }
}
