import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpStatusCode } from 'axios';
import { ResponseDto } from 'src/dto/response.dto';
import { AddPropertyDto } from './input/addPropertyInput';
import { InjectModel } from '@nestjs/mongoose';
import { Property } from './schema/property.schema';
import mongoose, { Model } from 'mongoose';
import { userID } from 'utils/mongoId/deScopeIdForrmater';
import { PropertyFilterInput } from './input/propertyFilterInput';
import * as xlsx from 'xlsx';
import { UpdatePropertyDto } from './input/updatePropertyInput';
import * as fs from 'fs';
import { PaginatedProperties } from './output/properties.dto';

@Injectable()
export class PropertyService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<Property>,
  ) {}

  async addSingleRecord(data: AddPropertyDto): Promise<ResponseDto> {
    try {
      await this.propertyModel.create({
        ...data,
        userId: userID(data.clerkId),
      });
      return {
        success: true,
        statusCode: HttpStatusCode.Created,
        msg: 'Record added',
      };
    } catch (e) {
      console.log(e);
      return {
        success: false,
        statusCode: HttpStatusCode.InternalServerError,
        msg: 'Failed to add new record',
      };
    }
  }

  async deleteSingleRecord(id: string): Promise<ResponseDto> {
    try {
      const result = await this.propertyModel.findByIdAndDelete(id);

      if (!result) {
        return {
          success: false,
          statusCode: HttpStatusCode.NotFound,
          msg: 'Record not found',
        };
      }

      return {
        success: true,
        statusCode: HttpStatusCode.Ok,
        msg: 'Record deleted successfully',
      };
    } catch (e) {
      console.error(e);
      return {
        success: false,
        statusCode: HttpStatusCode.InternalServerError,
        msg: 'Failed to delete record',
      };
    }
  }

  async getProperties(
    filter?: PropertyFilterInput,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc',
  ): Promise<PaginatedProperties> {
    const query: any = {};

    if (filter) {
      Object.keys(filter).forEach((key) => {
        if (
          filter[key] !== undefined &&
          key !== 'startDate' &&
          key !== 'endDate' &&
          key !== 'primaryPriceRange' &&
          key !== 'resalePriceRange' &&
          key !== 'rentRange' &&
          key !== 'bedrooms'
        ) {
          if (key === '_id') {
            query[key] = new mongoose.Types.ObjectId(filter[key]);
          } else if (typeof filter[key] === 'string') {
            query[key] = { $regex: new RegExp(filter[key], 'i') };
          } else {
            query[key] = filter[key];
          }
        }
      });

      // Date range filtering
      if (filter.startDate || filter.endDate) {
        query.createdAt = {};
        if (filter.startDate) query.createdAt.$gte = new Date(filter.startDate);
        if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
      }

      // Price range filtering
      if (filter.primaryPriceRange) {
        query.primaryPrice = {};
        if (filter.primaryPriceRange.min !== undefined)
          query.primaryPrice.$gte = filter.primaryPriceRange.min;
        if (filter.primaryPriceRange.max !== undefined)
          query.primaryPrice.$lte = filter.primaryPriceRange.max;
      }

      if (filter.resalePriceRange) {
        query.resalePrice = {};
        if (filter.resalePriceRange.min !== undefined)
          query.resalePrice.$gte = filter.resalePriceRange.min;
        if (filter.resalePriceRange.max !== undefined)
          query.resalePrice.$lte = filter.resalePriceRange.max;
      }

      if (filter.bedrooms) {
        query.bedrooms = {};
        if (filter.bedrooms.min !== undefined) {
          query.bedrooms.$gte = filter.bedrooms.min;
        }
        if (filter.bedrooms.max !== undefined) {
          query.bedrooms.$lte = filter.bedrooms.max;
        }
      }

      // Fix unitView filtering
      if (filter.unitView && filter.unitView.length > 0) {
        query.unitView = { $in: filter.unitView };
      }

      if (filter.rentRange) {
        query.Rent = {};
        if (filter.rentRange.min !== undefined)
          query.Rent.$gte = filter.rentRange.min;
        if (filter.rentRange.max !== undefined)
          query.Rent.$lte = filter.rentRange.max;
      }
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    // Ensure page is at least 1
    page = Math.max(page, 1);

    // Get total count efficiently
    const totalCount =
      Object.keys(query).length > 0
        ? await this.propertyModel.countDocuments(query)
        : await this.propertyModel.estimatedDocumentCount();

    // Fetch paginated properties
    const properties = await this.propertyModel
      .find(query)
      .sort({ [sortBy]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      data: properties,
      totalCount,
      totalPages: Math.max(Math.ceil(totalCount / limit), 1),
      pageNumber: page,
    };
  }

  async getSingleRecord(docId: string): Promise<Property> {
    const property = await this.propertyModel.findById(docId).exec();
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  async updateProperty(data: UpdatePropertyDto): Promise<any> {
    try {
      const { _id, ...updateFields } = data;

      const updatedFieldData = {
        ...updateFields,
        userId: userID(updateFields.clerkId),
      };

      const updatedProperty = await this.propertyModel.findByIdAndUpdate(
        _id,
        updatedFieldData,
        {
          new: true, // Return updated document
          runValidators: true, // Ensure validation is applied
        },
      );

      if (!updatedProperty) {
        return {
          success: false,
          statusCode: HttpStatusCode.NotFound,
          msg: 'Property not found',
        };
      }

      return {
        success: true,
        statusCode: HttpStatusCode.Ok,
        msg: 'Property updated successfully',
        data: updatedProperty,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
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
        await this.propertyModel.insertMany(batch);
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
