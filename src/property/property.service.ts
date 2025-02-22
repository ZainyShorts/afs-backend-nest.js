import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class PropertyService {

  constructor(@InjectModel(Property.name) private propertyModel:Model<Property>){}
  
  async addSingleRecord (data:AddPropertyDto):Promise<ResponseDto>{
    try{
        await this.propertyModel.create({
            ...data,
            userId:userID(data.clerkId)
        })
        return {
            success: true,
            statusCode:HttpStatusCode.Created,
            msg:"Record added"
        }
    }catch(e){
        console.log(e)
        return {
            success: false,
            statusCode:HttpStatusCode.InternalServerError,
            msg:"Failed to add new record"
        }
    }
  }

  async deleteSingleRecord(id: string): Promise<ResponseDto> {
    try {
      const result = await this.propertyModel.findByIdAndDelete(id);
      
      if (!result) {
        return {
          success: false,
          statusCode: HttpStatusCode.NotFound,
          msg: "Record not found"
        };
      }
  
      return {
        success: true,
        statusCode: HttpStatusCode.Ok,
        msg: "Record deleted successfully"
      };
    } catch (e) {
      console.error(e);
      return {
        success: false,
        statusCode: HttpStatusCode.InternalServerError,
        msg: "Failed to delete record"
      };
    }
  }
  


  async getProperties(
    filter?: PropertyFilterInput,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc'
  ): Promise<Property[]> {
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

      if (filter.unitView && filter.unitView.length > 0) {
        query.unitView = {
          $in: filter.unitView.map(tag => new RegExp(tag, "i")), // Case-insensitive regex match
        };
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
  
    return this.propertyModel
      .find(query)
      .sort({ [sortBy]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
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

      const updatedFieldData = {...updateFields,userId:userID(updateFields.clerkId)}

      const updatedProperty = await this.propertyModel.findByIdAndUpdate(_id, updatedFieldData, {
        new: true, // Return updated document
        runValidators: true, // Ensure validation is applied
      });

      if (!updatedProperty) {
        return {
          success: false,
          statusCode: HttpStatusCode.NotFound,
          msg: 'Property not found',
        }
      }

      return {
        success: true,
        statusCode: HttpStatusCode.Ok,
        msg: 'Property updated successfully',
        data: updatedProperty,
      };

    } 
    catch (error) {

      return {
        success: false,
        statusCode: HttpStatusCode.InternalServerError,
        msg: 'Failed to update property',
      }
    }
  }


//   async processExcelFile(filePath: string): Promise<ResponseDto> {
//     try {
//       // Read Excel file
//       const workbook = xlsx.readFile(filePath);
//       const sheetName = workbook.SheetNames[0];
//       const sheet = workbook.Sheets[sheetName];

//       // Convert sheet data to JSON
//       const jsonData: Partial<AddPropertyDto>[] = xlsx.utils.sheet_to_json(sheet);

//       if (jsonData.length === 0) {
//         return {
//           success: false,
//           statusCode: 400,
//           msg: 'Empty file uploaded',
//         };
//       }

//       // Validate and process each record
//       const records: AddPropertyDto[] = jsonData.map((record) => ({
//         ...record,
//         unitView: record.unitView ? record.unitView.split(',') : [],
//         propertyImages: record.propertyImages ? record.propertyImages.split(',') : [],
//       }));

//       // Insert into database
//       await this.propertyModel.insertMany(records);

//       return {
//         success: true,
//         statusCode: 201,
//         msg: `${records.length} records successfully inserted`,
//       };
//     } catch (error) {
//       console.error(error);
//       return {
//         success: false,
//         statusCode: 500,
//         msg: 'Error processing file',
//       };
//     }
//   }


}
