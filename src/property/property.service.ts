import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpStatusCode } from 'axios';
import { ResponseDto } from 'src/dto/response.dto';
import { AddPropertyDto } from './input/addPropertyInput';
import { InjectModel } from '@nestjs/mongoose';
import { Property } from './schema/property.schema';
import { Model } from 'mongoose';
import { userID } from 'utils/mongoId/deScopeIdForrmater';
import { PropertyFilterInput } from './input/propertyFilterInput';
import * as xlsx from 'xlsx';

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


  async getProperties(
    filter?: PropertyFilterInput,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc'
  ): Promise<Property[]> {
    // Convert filter object to MongoDB query
    const query: any = {};
    if (filter) {
      Object.keys(filter).forEach((key) => {
        if (filter[key] !== undefined) {
          // Enable text search on string fields
          query[key] = { $regex: new RegExp(filter[key], 'i') };
        }
      });
    }

    // Sorting direction
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
