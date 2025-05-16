import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HttpStatusCode } from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { userID } from 'utils/mongoId/deScopeIdForrmater';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { Inventory } from './schema/inventory.schema';
import { CreateInventorytDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryFilterInput } from './dto/inventoryFilterInput';
import { Project } from 'src/project/schema/project.schema';
import { SubDevelopment } from 'src/subdevelopment/schema/subdevelopment.schema';
import { MasterDevelopment } from 'src/masterdevelopment/schema/master-development.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<Inventory>,
    @InjectModel(Project.name) private projectModel: Model<Inventory>,
    @InjectModel(SubDevelopment.name)
    private subDevelopmenttModel: Model<Inventory>,
    @InjectModel(MasterDevelopment.name)
    private masterDevelopmentModel: Model<Inventory>,
  ) {}

  async create(dto: CreateInventorytDto): Promise<Inventory> {
    try {
      console.log(dto);
      const created = new this.inventoryModel(dto);
      return await created.save();
    } catch (error) {
      // Throw Internal Server Error
      console.log(error);
      throw new InternalServerErrorException(
        error?.response?.message || 'Internal server error occurred.',
      );
    }
  }

  async delete(id: string) {
    try {
      const result = await this.inventoryModel.findByIdAndDelete(id);

      if (!result) {
        throw new NotFoundException('Record not found');
      }

      return {
        success: true,
        msg: 'Record deleted successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to delete record',
      );
    }
  }

  async findAll(
    filter?: InventoryFilterInput,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    populate?: string,
  ): Promise<any> {
    try {
      const query: any = {};
      if (filter) {
        // if (filter.masterDevelopment) {
        //   const masterDevelopmentDocument = await this.masterDevelopmentModel
        //     .findOne({
        //       developmentName: filter.masterDevelopment,
        //     })
        //     .select('_id');
        //   console.log(masterDevelopmentDocument);
        //   query.masterDevelopment = masterDevelopmentDocument._id;
        // }

        // if (filter.subDevelopment) {
        //   const subDevelopmentDocument =
        //     await this.subDevelopmenttModel.findOne({
        //       subDevelopment: filter.subDevelopment,
        //     });
        //   query.subDevelopment = subDevelopmentDocument._id;
        // }

        if (filter.project) {
          const projectDocument = await this.projectModel
            .findOne({
              projectName: filter.project,
            })
            .select('_id');
          console.log(projectDocument);
          if (projectDocument != null) {
            query.project = projectDocument._id.toString();
          } else {
            query.project = filter.project;
          }
        }

        if (filter.unitNumber) {
          query.unitNumber = filter.unitNumber;
        }

        if (filter.unitType) {
          query.unitType = filter.unitType;
        }

        if (filter.unitInternalDesign) {
          query.unitInternalDesign = filter.unitInternalDesign;
        }

        if (filter.unitExternalDesign) {
          query.unitExternalDesign = filter.unitExternalDesign;
        }

        if (filter.unitView?.length > 0) {
          query.unitView = { $in: filter.unitView };
        }

        if (filter.rentalPriceRange) {
          query.rentalPrice = {};
          if (filter.rentalPriceRange.min !== undefined)
            query.rentalPrice.$gte = filter.rentalPriceRange.min;
          if (filter.rentalPriceRange.max !== undefined)
            query.rentalPrice.$lte = filter.rentalPriceRange.max;
        }

        if (filter.salePriceRange) {
          query.salePrice = {};
          if (filter.salePriceRange.min !== undefined)
            query.salePrice.$gte = filter.salePriceRange.min;
          if (filter.salePriceRange.max !== undefined)
            query.salePrice.$lte = filter.salePriceRange.max;
        }

        if (filter.originalPriceRange) {
          query.originalPrice = {};
          if (filter.originalPriceRange.min !== undefined)
            query.originalPrice.$gte = filter.originalPriceRange.min;
          if (filter.originalPriceRange.max !== undefined)
            query.originalPrice.$lte = filter.originalPriceRange.max;
        }

        if (filter.premiumAndLossRange) {
          query.premiumAndLoss = {};
          if (filter.premiumAndLossRange.min !== undefined)
            query.premiumAndLoss.$gte = filter.premiumAndLossRange.min;
          if (filter.premiumAndLossRange.max !== undefined)
            query.premiumAndLoss.$lte = filter.premiumAndLossRange.max;
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

      // Build populate options dynamically
      const populateOptions: any = [];

      if (populate) {
        const populateFields = populate.split(',').map((f) => f.trim());

        // If project is requested, handle nested populate inside it
        if (populateFields.includes('project')) {
          const nestedPopulate = [];
          if (populateFields.includes('masterDevelopment')) {
            nestedPopulate.push({
              path: 'masterDevelopment',
              select: 'developerName roadLocation',
            });
          }
          if (populateFields.includes('subDevelopment')) {
            nestedPopulate.push({
              path: 'subDevelopment',
              select: 'subDevelopment',
            });
          }

          populateOptions.push({
            path: 'project',
            select: 'projectName masterDevelopment subDevelopment',
            populate: nestedPopulate.length > 0 ? nestedPopulate : undefined,
          });
        } else {
          // If project is NOT requested, just populate other top-level fields if any
          populateFields.forEach((field) => {
            if (field !== 'masterDevelopment' && field !== 'subDevelopment') {
              populateOptions.push({ path: field });
            }
          });
        }
      }

      const totalCount =
        Object.keys(query).length > 0
          ? await this.inventoryModel.countDocuments(query)
          : await this.inventoryModel.estimatedDocumentCount();

      console.log(query);

      let queryBuilder = this.inventoryModel
        .find(query)
        .sort({ [sortBy]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit);

      // Apply populate dynamically
      if (populateOptions.length > 0) {
        populateOptions.forEach((opt) => {
          queryBuilder = queryBuilder.populate(opt);
        });
      }

      const data = await queryBuilder.exec();

      return {
        data,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        pageNumber: page,
      };
    } catch (error) {
      console.error('Error fetching Inventory:', error);
      throw new InternalServerErrorException(
        error?.message || 'An error occurred while fetching Inventory.',
      );
    }
  }

  async findOne(id: string, populateFields?: string[]): Promise<Inventory> {
    try {
      let query = this.inventoryModel.findById(id);

      // Dynamically populate if fields are provided
      if (populateFields && populateFields.length > 0) {
        populateFields.forEach((field) => {
          query = query.populate(field);
        });
      }

      const project = await query.exec();

      if (!project) {
        throw new NotFoundException(`Unit with ID ${id} not found`);
      }

      return project;
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to find Unit',
      );
    }
  }

  async updateProperty(
    id: string,
    updateData: UpdateInventoryDto,
  ): Promise<any> {
    try {
      const updatedProperty = await this.inventoryModel.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        },
      );

      console.log(updatedProperty);

      if (!updatedProperty) {
        return {
          success: false,
          msg: 'Property not found',
        };
      }

      return {
        success: true,
        msg: 'Property updated successfully',
        data: updatedProperty,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log(error);
      return {
        success: false,
        statusCode: HttpStatusCode.InternalServerError,
        msg: 'Failed to update property',
      };
    }
  }

  async readXlsxAndInsert(filePath: string, clerkId: string): Promise<any> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // Function to convert keys to camelCase
      const toCamelCase = (str: string) =>
        str
          .replace(/\s(.)/g, (match) => match.toUpperCase())
          .replace(/\s/g, '')
          .replace(/^(.)/, (match) => match.toLowerCase());

      // Normalize data keys for each row
      const formattedSheetData = sheetData.map((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach((key) => {
          newRow[toCamelCase(key)] = row[key];
        });
        return newRow;
      });

      console.log(`Rows extracted from Excel: ${formattedSheetData.length}`);

      // Convert data into MongoDB insert format
      const insertion = formattedSheetData.map((data: any) => ({
        userId: userID(clerkId),
        clerkId: clerkId,
        roadLocation: data.roadLocation || null,
        developmentName: data.developmentName || null,
        subDevelopmentName: data.subDevelopmentName || null,
        projectName: data.projectName || null,
        propertyType: data.propertyType || null,
        propertyHeight: data.propertyHeight || null,
        projectLocation: data.projectLocation || null,
        unitNumber: data.unitNumber || null,
        bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
        unitLandSize: data.unitLandSize || null,
        unitBua: data.unitBua ? Number(data.unitBua) : null,
        unitLocation: data.unitLocation || null,
        unitView: data.unitView
          ? Array.isArray(data.unitView)
            ? data.unitView
            : [data.unitView]
          : [],
        propertyImages: data.propertyImages
          ? Array.isArray(data.propertyImages)
            ? data.propertyImages
            : [data.propertyImages]
          : [],
        Purpose: data.Purpose || null,
        vacancyStatus: data.vacancyStatus || null,
        primaryPrice: data.primaryPrice ? Number(data.primaryPrice) : null,
        resalePrice: data.resalePrice ? Number(data.resalePrice) : null,
        premiumAndLoss: data.premiumAndLoss
          ? Number(data.premiumAndLoss)
          : null,
        Rent: data.Rent ? Number(data.Rent) : null,
        noOfCheques: data.noOfCheques ? Number(data.noOfCheques) : null,
      }));

      console.log(`Records to insert: ${insertion.length}`);

      // Batch Insert
      const BATCH_SIZE = 10000;
      let batchCount = 0;

      for (let i = 0; i < insertion.length; i += BATCH_SIZE) {
        const batch = insertion.slice(i, i + BATCH_SIZE);
        await this.inventoryModel.insertMany(batch);
        batchCount++;
        console.log(`Inserted batch ${batchCount}, Records: ${batch.length}`);
      }

      console.log('All records inserted successfully!');

      return {
        success: true,
        statusCode: 201,
        message: 'All records inserted successfully',
      };
    } catch (e) {
      console.error(e);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      if (filePath) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
    }
  }
}
