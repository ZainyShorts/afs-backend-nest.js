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
import { headerMapping } from 'utils/methods/methods';

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
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'Failed to create master development. Check your input.',
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
        if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
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
    return this.MasterDevelopmentModel.findById(id).exec();
  }

  async delete(id: string): Promise<void> {
    await this.MasterDevelopmentModel.findByIdAndDelete(id).exec();
  }

  async update(
    id: string,
    dto: UpdateMasterDevelopmentDto,
  ): Promise<MasterDevelopment> {
    const dev = await this.MasterDevelopmentModel.findById(id);
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
    return this.MasterDevelopmentModel.findByIdAndUpdate(id, dto, {
      new: true,
    }).exec();
  }

  async importExcelFile(filePath: string): Promise<any> {
    try {
      // Read the file from the file system
      const fileBuffer = fs.readFileSync(filePath);

      // Parse the Excel file
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // Manually map headers to database keys
      const formattedData = jsonData.map((row: any) => {
        const formattedRow: any = {};
        for (const key in row) {
          const cleanedKey = key.replace(/\n/g, '').trim(); // Normalize the key
          const mappedKey = headerMapping[cleanedKey];
          if (mappedKey) {
            formattedRow[mappedKey] = row[key];
          }
        }

        // Calculate the totalLandSize field as the sum of specific areas
        formattedRow.totalAreaSqFt =
          (formattedRow.buaAreaSqFt || 0) +
          (formattedRow.facilitiesAreaSqFt || 0) +
          (formattedRow.amentiesAreaSqFt || 0);

        // Validate that all required fields are present
        const requiredFields = [
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

      // Step 1: Deduplicate in-memory (e.g., using a Set to check unique fields)
      const uniqueRecords = new Map();
      formattedData.forEach((dto) => {
        if (this.validateEntry(dto)) {
          uniqueRecords.set(dto.developmentName, dto); // Only add valid records
        } else {
          console.log(`Skipping invalid entry`);
        }
      });

      let insertedDataCount = 0;
      let duplicateDataCount = 0;
      // Step 2: Bulk insert using database methods (adjust as per your database)
      const bulkInsertData = Array.from(uniqueRecords.values());

      // Step 3: Split the data into chunks of 5,000 records
      const chunkSize = 5000;
      for (let i = 0; i < bulkInsertData.length; i += chunkSize) {
        const chunk = bulkInsertData.slice(i, i + chunkSize);

        // STEP 1: Get existing names for this chunk
        const existingNames = await this.MasterDevelopmentModel.find(
          { developmentName: { $in: chunk.map((row) => row.developmentName) } },
          'developmentName',
        ).lean();

        console.log('existingNames', existingNames);

        const existingNameSet = new Set(
          existingNames.map((r) => r.developmentName),
        );
        console.log('existingNameSet', existingNameSet);

        // STEP 2: Filter out duplicates
        const filteredChunk = chunk.filter(
          (row) => !existingNameSet.has(row.developmentName),
        );

        console.log('filteredChunk', filteredChunk);
        insertedDataCount += filteredChunk.length;
        duplicateDataCount += existingNames.length;

        if (filteredChunk.length === 0) continue;

        // STEP 3: Insert remaining
        try {
          await this.MasterDevelopmentModel.insertMany(filteredChunk, {
            ordered: false,
          });
        } catch (error) {
          console.error(`Error inserting chunk starting at index ${i}:`, error);
        }
      }

      // After processing, delete the file
      fs.unlinkSync(filePath); // This will delete the file from the filesystem

      return {
        success: true,
        totalEntries: jsonData.length,
        insertedEntries: insertedDataCount,
        skippedDuplicateEntires: duplicateDataCount,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Delete the file if an error occurs
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Ensure the file is deleted in case of an error
      }
      if (error.response.statusCode == 400) {
        throw new BadRequestException(
          'File format is not correct. Missing or empty fields.',
        );
      }
      // Throw Internal Server Error
      throw new InternalServerErrorException(
        error?.response?.message || 'Internal server error occurred.',
      );
    }
  }
}
