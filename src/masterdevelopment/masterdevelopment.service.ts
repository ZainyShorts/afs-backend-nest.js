import {
  BadRequestException,
  Injectable, 
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { Project } from 'src/project/schema/project.schema';
import { Inventory } from 'src/inventory/schema/inventory.schema';
import { SubDevelopment } from 'src/subdevelopment/schema/subdevelopment.schema'; 
import { Customer } from 'src/customer/schema/customer.schema';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MasterDevelopmentService {
  constructor(
    @InjectModel(MasterDevelopment.name)
    private readonly MasterDevelopmentModel: Model<MasterDevelopment>,
    @InjectModel(SubDevelopment.name)
    private readonly subDevelopmentModel: Model<SubDevelopment>,
    @InjectModel(Project.name)
    private readonly ProjectModel: Model<Project>,
    @InjectModel(Inventory.name)
    private readonly InventoryModel: Model<Inventory>,
    @InjectConnection() private readonly connection: Connection, 
        @InjectModel(Customer.name) private customerModel: Model<Customer>, 
    
  ) {}

  async create(
    dto: CreateMasterDevelopmentDto,
    userId: string,
  ): Promise<MasterDevelopment> {
    try {
      const duplicate = await this.MasterDevelopmentModel.findOne({
        developmentName: dto.developmentName,
        user: userId,
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

      const created = new this.MasterDevelopmentModel({ ...dto, user: userId });
      return await created.save();
    } catch (error) {
  const statusCode = error?.response?.statusCode;

  if (statusCode === 400) {
    throw new BadRequestException(error?.response?.message);
  }

  throw new InternalServerErrorException(
    error?.response?.message || 'Internal server error occurred.',
  );
}
  }
   async findOneWithCustomers(id: string): Promise<{
        inventory: MasterDevelopment;
        currentCustomers: any[];
      }> {
        try {
          console.log('🔍 Received inventory ID:', id);
      
          // Validate ObjectId
          if (!Types.ObjectId.isValid(id)) {
            console.error('❌ Invalid ObjectId:', id);
            throw new BadRequestException(`Invalid inventory ID: ${id}`);
          }
      
          // Find inventory by ID
          const inventory = await this.MasterDevelopmentModel.findById(id).exec();
          console.log('📦 Fetched inventory:', inventory);
      
          if (!inventory) {
            console.warn(`⚠️ Inventory not found for ID: ${id}`);
            throw new NotFoundException(`Sub Development unit with ID ${id} not found`);
          }
      
          let currentCustomers = [];
          if (inventory.customers?.length) {
            console.log('👥 Fetching current customers:', inventory.customers);
            currentCustomers = await this.customerModel
              .find({ _id: { $in: inventory.customers } })
              .select(
                'customerName customerType customerSegment customerCategory emailAddress mobile1 contactPerson',
              )
              .exec();
            console.log('✅ Found current customers:', currentCustomers.length);
          }
      
         
      
          console.log('🎉 Returning final result');
          return {
            inventory,
            currentCustomers,
          };
        } catch (error) {
          console.error('🔥 Error in findOneWithCustomers:', error);
          throw new InternalServerErrorException(
            error.message || 'Failed to find inventory unit with customers',
          );
        }
      }
  async findAll(
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filter?: MasterDevelopmentFilterInput,
    fields?: string,
  ) {
    try {
      const query: any = {};

      console.log(filter.developmentName);

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

      const projection = fields ? fields.split(',').join(' ') : '';
      const data = await this.MasterDevelopmentModel.find(query)
        .select(projection)
        .sort({ [sortBy]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      // const queryBuilder = this.MasterDevelopmentModel.find(query)
      //   .sort({ [sortBy]: sortDirection })
      //   .skip((page - 1) * limit)
      //   .limit(limit);

      // // Only apply `.select()` if fields are provided
      // if (fields) {
      //   const projection = fields.split(',').join(' ');
      //   queryBuilder.select(projection);
      // }

      // console.log(queryBuilder);

      // const data = await queryBuilder.exec();

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

  async selectiveFindAll(
    filter?: MasterDevelopmentFilterInput,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    fields?: string,
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

      const projection = fields ? fields.split(',').join(' ') : '';

      const data = await this.MasterDevelopmentModel.find(query)
        .select(projection)
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
  async removeCustomer(masterDevelopmentId: string, customerId: string): Promise<MasterDevelopment> {
  try {
    const development = await this.MasterDevelopmentModel.findById(masterDevelopmentId).exec();

    if (!development) {
      throw new Error('MasterDevelopment not found');
    }

    // Step 1: Remove customerId from MasterDevelopment.customers
    const index = development.customers.findIndex((id: string) => id === customerId);

    if (index !== -1) {
      development.customers.splice(index, 1);
      await development.save();
    }

    // Step 2: Remove masterDevelopment assignment from Customer.assigned
    const customer = await this.customerModel.findById(customerId).exec();

    if (!customer) {
      throw new Error('Customer not found');
    }

    if (Array.isArray(customer.assigned)) {
      customer.assigned = customer.assigned.filter(
        (assignment) => !(assignment.id === masterDevelopmentId && assignment.name === 'masterDevelopment'),
      );

      await customer.save();
    }

    return development;
  } catch (error) {
    console.error('Error removing customer from MasterDevelopment:', error);
    throw new Error('Failed to remove customer from MasterDevelopment');
  }
}

  async addCustomer(masterDevelopmentId: string, customerId: string): Promise<MasterDevelopment> {
  try {
    const development = await this.MasterDevelopmentModel.findById(masterDevelopmentId).exec();

    if (!development) {
      throw new Error('MasterDevelopment not found');
    }

    // Step 1: Add customerId to MasterDevelopment if not already present
    if (!development.customers.includes(customerId)) {
      development.customers.push(customerId);
      await development.save();
    }

    // Step 2: Update the customer's `assigned` array
    const customer = await this.customerModel.findById(customerId).exec();

    if (!customer) {
      throw new Error('Customer not found');
    }

    const alreadyAssigned = customer.assigned?.some(
      (entry) => entry.id === masterDevelopmentId && entry.name === 'masterDevelopment'
    );

    if (!alreadyAssigned) {
      const newAssignment = {
        id: masterDevelopmentId,
        name: 'masterDevelopment',
        propertyName: development.developmentName,
      };

      if (!customer.assigned) {
        customer.assigned = [newAssignment];
      } else {
        customer.assigned.push(newAssignment);
      }

      await customer.save();
    }

    return development;
  } catch (error) {
    console.error('Error adding customer to MasterDevelopment:', error);
    throw new Error('Failed to add customer to MasterDevelopment');
  }
}



 async delete(id: string): Promise<void> {
  const session = await this.connection.startSession();
  session.startTransaction();
  try {
    // Handle both string and ObjectId
    const masterDevId = Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id;

    // 1. Find all subDevelopments for this masterDevelopment
    const subDevs = await this.subDevelopmentModel.find({
      $or: [
        { masterDevelopment: id },
        { masterDevelopment: masterDevId },
      ],
    }, null, { session });
    const subDevIds = subDevs.map((sd) => sd._id);

    // 2. Find all projects for this masterDevelopment and subDevelopments
    const projects = await this.ProjectModel.find({
      $or: [
        { masterDevelopment: id },
        { masterDevelopment: masterDevId },
        { subDevelopment: { $in: subDevIds } },
      ],
    }, null, { session });
    const projectIds = projects.map((p) => p._id.toString());

    // 3. Delete inventories linked to these projects
    await this.InventoryModel.deleteMany({ project: { $in: projectIds } }, { session });

    // 4. Delete projects
    await this.ProjectModel.deleteMany({
      $or: [
        { masterDevelopment: id },
        { masterDevelopment: masterDevId },
        { subDevelopment: { $in: subDevIds } },
      ],
    }, { session });

    // 5. Delete subDevelopments
    await this.subDevelopmentModel.deleteMany({
      $or: [
        { masterDevelopment: id },
        { masterDevelopment: masterDevId },
      ],
    }, { session });

    const masterDev = await this.MasterDevelopmentModel.findById(masterDevId).session(session);
    if (masterDev) {
      const customerIds: string[] = masterDev.customers || [];

      if (customerIds.length > 0) {
        const customers = await this.customerModel.find({ _id: { $in: customerIds } }).session(session);

        for (const customer of customers) {
          if (Array.isArray(customer.assigned)) {
            customer.assigned = customer.assigned.filter(
              (entry) => !(entry.id === masterDevId.toString() && entry.name === 'masterDevelopment')
            );
            await customer.save({ session });
          }
        }
      }
    }

    // 7. Delete the masterDevelopment
    await this.MasterDevelopmentModel.deleteOne({
      $or: [
        { _id: id },
        { _id: masterDevId },
      ],
    }, { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error('Error during cascading delete of MasterDevelopment:', error);
    throw new Error('Failed to delete MasterDevelopment and related data');
  } finally {
    session.endSession();
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
      throw new BadRequestException(error.response.message);
    }
  }

  // async importExcelFile(filePath: string, userId: string): Promise<any> {
  //   try {
  //     const fileBuffer = fs.readFileSync(filePath);
  //     const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  //     const sheetName = workbook.SheetNames[0];
  //     const sheet = workbook.Sheets[sheetName];

  //     // Convert rows to JSON from the second row onwards
  //     const rowData = XLSX.utils.sheet_to_json(sheet);

  //     console.log('First 5 rows:', rowData.slice(0, 5));

  //     const requiredFields = [
  //       'country',
  //       'city',
  //       'roadLocation',
  //       'developmentName',
  //       'locationQuality',
  //       'totalAreaSqFt',
  //     ];

  //     const validRows: any[] = [];
  //     const invalidRows: any[] = [];

  //     rowData.forEach((row: any, index: number) => {
  //       // console.log('Raw Row:', row);

  //       const formattedRow: any = {};
  //       const cleanedKeys = {};

  //       // Iterate through each column and map the cleaned keys
  //       for (const key in row) {
  //         const cleanedKey = key.replace(/\n/g, '').replace(/\./g, '').trim();
  //         cleanedKeys[key] = cleanedKey; // For debugging

  //         // First try exact mapping
  //         let mappedKey = MasterDevelopmentheaderMapping[cleanedKey];

  //         // Fallback mappings for area fields
  //         if (!mappedKey) {
  //           if (
  //             cleanedKey.includes('BUAArea') ||
  //             cleanedKey.includes('BUA Area')
  //           ) {
  //             mappedKey = 'buaAreaSqFt';
  //           } else if (
  //             cleanedKey.includes('FacilitiesArea') ||
  //             cleanedKey.includes('Facilities Area')
  //           ) {
  //             mappedKey = 'facilitiesAreaSqFt';
  //           } else if (
  //             cleanedKey.includes('AmenitiesArea') ||
  //             cleanedKey.includes('Amenities Area')
  //           ) {
  //             mappedKey = 'amentiesAreaSqFt';
  //           }
  //         }

  //         if (mappedKey) {
  //           formattedRow[mappedKey] = row[key];
  //         }
  //       }

  //       // console.log('Cleaned Keys Mapping:', cleanedKeys);
  //       console.log('Formatted Row:', formattedRow);

  //       // Convert area fields to numbers
  //       const buaArea = Number(formattedRow.buaAreaSqFt) || 0;
  //       const facilitiesArea = Number(formattedRow.facilitiesAreaSqFt) || 0;
  //       const amenitiesArea = Number(formattedRow.amentiesAreaSqFt) || 0;

  //       console.log('Area Values:', { buaArea, facilitiesArea, amenitiesArea });

  //       // Calculate total area
  //       formattedRow.totalAreaSqFt = buaArea + facilitiesArea + amenitiesArea;

  //       // Check for missing required fields
  //       const missingFields = requiredFields.filter(
  //         (field) =>
  //           formattedRow[field] === undefined ||
  //           formattedRow[field] === null ||
  //           formattedRow[field] === '',
  //       );

  //       if (missingFields.length > 0) {
  //         invalidRows.push({
  //           index: index + 2, // +2 because Excel rows start at 1 and header is row 1
  //           missingFields,
  //           row: formattedRow,
  //         });
  //         return;
  //       }

  //       validRows.push(formattedRow);
  //     });

  //     // If no valid rows, return early
  //     if (validRows.length === 0) {
  //       return {
  //         success: true,
  //         totalEntries: rowData.length,
  //         insertedEntries: 0,
  //         skippedDuplicateEntries: invalidRows.length,
  //         invalidRows,
  //       };
  //     }

  //     // Check for duplicates
  //     const allDevelopmentNames = validRows.map((row) =>
  //       row.developmentName.trim(),
  //     );

  //     const existingDevelopments = await this.MasterDevelopmentModel.find(
  //       { developmentName: { $in: allDevelopmentNames } },
  //       'developmentName',
  //     ).lean();

  //     const existingNameSet = new Set(
  //       existingDevelopments.map((r) => r.developmentName.trim()),
  //     );

  //     let dbDuplicates = 0;
  //     let fileDuplicates = 0;
  //     const seenDevelopmentNames = new Set<string>();

  //     const filteredData = validRows.filter((row) => {
  //       const devName = row.developmentName.trim();
  //       if (existingNameSet.has(devName)) {
  //         dbDuplicates++;
  //         return false;
  //       }
  //       if (seenDevelopmentNames.has(devName)) {
  //         fileDuplicates++;
  //         return false;
  //       }
  //       seenDevelopmentNames.add(devName);
  //       return true;
  //     });

  //     // Validate remaining records
  //     const validatedRecords = filteredData.filter((dto) => {
  //       return this.validateEntry(dto);
  //     });

  //     // If no validated records, return early
  //     if (validatedRecords.length === 0) {
  //       return {
  //         success: true,
  //         totalEntries: rowData.length,
  //         insertedEntries: 0,
  //         skippedDuplicateEntries: dbDuplicates + fileDuplicates,
  //         skippedInvalidEntries:
  //           invalidRows.length + (validRows.length - validatedRecords.length),
  //         invalidRows,
  //       };
  //     }

  //     // Insert records in chunks
  //     const chunkSize = 5000;
  //     let insertedDataCount = 0;

  //     for (let i = 0; i < validatedRecords.length; i += chunkSize) {
  //       const chunk = validatedRecords.slice(i, i + chunkSize);
  //       try {
  //         const chunkWithUser = chunk.map((doc) => ({
  //           ...doc,
  //           user: userId,
  //           createdAt: new Date(),
  //           updatedAt: new Date(),
  //         }));

  //         const result = await this.MasterDevelopmentModel.insertMany(
  //           chunkWithUser,
  //           {
  //             ordered: false,
  //           },
  //         );

  //         insertedDataCount += result.length;
  //       } catch (error) {
  //         console.error(`Error inserting chunk starting at index ${i}:`, error);
  //         // Continue with next chunk even if one fails
  //       }
  //     }

  //     return {
  //       success: true,
  //       totalEntries: rowData.length,
  //       insertedEntries: insertedDataCount,
  //       skippedDuplicateEntries: dbDuplicates + fileDuplicates,
  //       skippedInvalidEntries: invalidRows.length,
  //       invalidRows,
  //     };
  //   } catch (error: any) {
  //     if (error instanceof SyntaxError || error.message.includes('Invalid')) {
  //       throw new BadRequestException(
  //         'File format is not correct. Missing or empty fields.',
  //       );
  //     }
  //     throw new InternalServerErrorException(
  //       error?.message || 'Internal server error occurred.',
  //     );
  //   } finally {
  //     // Clean up uploaded file after processing
  //     if (fs.existsSync(filePath)) {
  //       try {
  //         fs.unlinkSync(filePath);
  //       } catch (unlinkErr) {
  //         console.error('Error deleting file:', unlinkErr);
  //       }
  //     }
  //   }
  // }

  async importExcelFile(filePath: string, userId: string): Promise<any> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert rows to JSON from the second row onwards
      const rowData = XLSX.utils.sheet_to_json(sheet);

      console.log('First 5 rows:', rowData.slice(0, 5));

      const requiredFields = [
        'country',
        'city',
        'roadLocation',
        'developmentName',
        'locationQuality',
        'totalAreaSqFt',
      ];

      const validRows: any[] = [];
      const invalidRows: any[] = [];
      const validationErrors: any[] = [];

      rowData.forEach((row: any, index: number) => {
        const formattedRow: any = {};
        const cleanedKeys = {};

        // Clean and map column headers
        for (const key in row) {
          const cleanedKey = key.replace(/\n/g, '').replace(/\./g, '').trim();
          cleanedKeys[key] = cleanedKey;

          let mappedKey = MasterDevelopmentheaderMapping[cleanedKey];

          // Fallback mappings for area fields
          if (!mappedKey) {
            if (cleanedKey.match(/BUAArea|BUA Area/i)) {
              mappedKey = 'buaAreaSqFt';
            } else if (cleanedKey.match(/FacilitiesArea|Facilities Area/i)) {
              mappedKey = 'facilitiesAreaSqFt';
            } else if (cleanedKey.match(/AmenitiesArea|Amenities Area/i)) {
              mappedKey = 'amentiesAreaSqFt';
            }
          }

          if (mappedKey) {
            formattedRow[mappedKey] = row[key];
          }
        }

        // Convert area fields to numbers
        const buaArea = Number(formattedRow.buaAreaSqFt) || 0;
        const facilitiesArea = Number(formattedRow.facilitiesAreaSqFt) || 0;
        const amenitiesArea = Number(formattedRow.amentiesAreaSqFt) || 0;

        // Calculate total area
        formattedRow.totalAreaSqFt = buaArea + facilitiesArea + amenitiesArea;

        // Check for missing required fields
        const missingFields = requiredFields.filter(
          (field) =>
            formattedRow[field] === undefined ||
            formattedRow[field] === null ||
            formattedRow[field] === '',
        );

        if (missingFields.length > 0) {
          invalidRows.push({
            rowNumber: index + 2, // +2 because Excel rows start at 1 and header is row 1
            missingFields,
            row: formattedRow,
            errorType: 'missing_fields',
          });
          return;
        }

        // Validate the row structure
        try {
          if (this.validateEntry(formattedRow)) {
            validRows.push(formattedRow);
          } else {
            validationErrors.push({
              rowNumber: index + 2,
              row: formattedRow,
              errorType: 'validation_failed',
            });
          }
        } catch (validationError) {
          validationErrors.push({
            rowNumber: index + 2,
            row: formattedRow,
            errorType: 'validation_error',
            message: validationError.message,
          });
        }
      });

      // Early return if no valid rows
      if (validRows.length === 0) {
        return {
          success: true,
          totalEntries: rowData.length,
          insertedEntries: 0,
          skippedDuplicateEntries: 0,
          skippedInvalidEntries: invalidRows.length + validationErrors.length,
          invalidEntries: [...invalidRows, ...validationErrors],
        };
      }

      // Check for duplicates
      const allDevelopmentNames = validRows.map((row) =>
        row.developmentName.trim(),
      );

      const existingDevelopments = await this.MasterDevelopmentModel.find(
        { developmentName: { $in: allDevelopmentNames } },
        'developmentName',
      ).lean();

      const existingNameSet = new Set(
        existingDevelopments.map((r) => r.developmentName.trim()),
      );

      const duplicateEntries = [];
      const seenDevelopmentNames = new Set<string>();
      const uniqueRows = validRows.filter((row) => {
        const devName = row.developmentName.trim();

        if (existingNameSet.has(devName)) {
          duplicateEntries.push({
            rowNumber: row.__rowNum__ + 2,
            row,
            errorType: 'duplicate_in_database',
          });
          return false;
        }
        if (seenDevelopmentNames.has(devName)) {
          duplicateEntries.push({
            rowNumber: row.__rowNum__ + 2,
            row,
            errorType: 'duplicate_in_file',
          });
          return false;
        }
        seenDevelopmentNames.add(devName);
        return true;
      });

      
      // Insert records in chunks
      const chunkSize = 5000;
      let insertedDataCount = 0;

      for (let i = 0; i < uniqueRows.length; i += chunkSize) {
        const chunk = uniqueRows.slice(i, i + chunkSize);
        try {
          const chunkWithUser = chunk.map((doc) => ({
            ...doc,
            user: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          const result = await this.MasterDevelopmentModel.insertMany(
            chunkWithUser,
            { ordered: false },
          );
          insertedDataCount += result.length;
        } catch (error) {
          console.error(`Error inserting chunk starting at index ${i}:`, error);
          // Convert chunk errors to validation errors
          if (error.writeErrors) {
            error.writeErrors.forEach((writeError) => {
              validationErrors.push({
                rowNumber: i + writeError.index + 2,
                row: chunk[writeError.index],
                errorType: 'insert_error',
                message: writeError.errmsg,
              });
            });
          }
        }
      }

      return {
        success: true,
        totalEntries: rowData.length,
        insertedEntries: insertedDataCount,
        skippedDuplicateEntries: duplicateEntries.length,
        skippedInvalidEntries: invalidRows.length + validationErrors.length,
        duplicateEntries,
        invalidEntries: [...invalidRows, ...validationErrors],
      };
    } catch (error: any) {
      if (error instanceof SyntaxError || error.message.includes('Invalid')) {
        throw new BadRequestException(
          'File format is not correct. Missing or empty fields.',
        );
      }
      throw new InternalServerErrorException(
        error?.message || 'Internal server error occurred.',
      );
    } finally {
      // Clean up uploaded file after processing
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        }
      }
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

  async countInventoryByPropertyType(masterDevelopmentId, propertyType) {
    try {
      // Find project IDs of given propertyType under masterDevelopment
      const projects = await this.ProjectModel.find({
        masterDevelopment: masterDevelopmentId,
        propertyType,
      }).select('_id');

      const projectIds = projects.map((p) => p._id);

      // Count inventory with project in those IDs
      const count = await this.InventoryModel.countDocuments({
        project: { $in: projectIds },
      });

      return count;
    } catch (error) {
      console.error(
        `Error counting inventory for propertyType ${propertyType}:`,
        error,
      );
      throw error; // rethrow or handle as needed
    }
  }

  async report(id: string): Promise<any> {
    try {
      const [
        development,
        subDevStatuses,
        projStatuses,
        subDevStatsRaw,
        projStatsRaw,
        propertyTypeCounts,
        inventoryCounts,
        availabilityCounts,
      ] = await Promise.all([
        // 1. Development details
        this.MasterDevelopmentModel.findById(id)
          .select(
            'roadLocation developmentName locationQuality facilitiesCategories amentiesCategories',
          )
          .exec(),

        // 2. Plot status from subDevelopments
        this.subDevelopmentModel.aggregate([
          { $match: { masterDevelopment: id, plotStatus: { $exists: true } } },
          { $group: { _id: '$plotStatus', count: { $sum: 1 } } },
        ]),

        // 3. Plot status from Projects
        this.ProjectModel.aggregate([
          {
            $match: {
              masterDevelopment: id,
              'plot.plotStatus': { $exists: true },
            },
          },
          { $group: { _id: '$plot.plotStatus', count: { $sum: 1 } } },
        ]),

        // 4. Min/Max stats from subDevelopments
        this.subDevelopmentModel.aggregate([
          { $match: { masterDevelopment: id } },
          {
            $group: {
              _id: null,
              minHeight: { $min: '$plotHeight' },
              maxHeight: { $max: '$plotHeight' },
              minBUA: { $min: '$plotBUASqFt' },
              maxBUA: { $max: '$plotBUASqFt' },
            },
          },
        ]),

        // 5. Min/Max stats from Projects
        this.ProjectModel.aggregate([
          { $match: { masterDevelopment: id } },
          {
            $group: {
              _id: null,
              minHeight: { $min: '$plotHeight' },
              maxHeight: { $max: '$plotHeight' },
              minBUA: { $min: '$plotBUASqFt' },
              maxBUA: { $max: '$plotBUASqFt' },
            },
          },
        ]),

        // 6. Property type counts from Projects
        this.ProjectModel.aggregate([
          { $match: { masterDevelopment: id } },
          { $group: { _id: '$propertyType', count: { $sum: 1 } } },
        ]),

        // 7. Inventory counts by property type
        Promise.all([
          this.countInventoryByPropertyType(id, 'Apartment'),
          this.countInventoryByPropertyType(id, 'Villas'),
          this.countInventoryByPropertyType(id, 'Hotel'),
          this.countInventoryByPropertyType(id, 'Townhouses'),
          this.countInventoryByPropertyType(id, 'Labour Camp'),
        ]),

        // 8. Availability counts via project lookup
        this.InventoryModel.aggregate([
          {
            $lookup: {
              from: 'projects',
              localField: 'project',
              foreignField: '_id',
              as: 'project',
            },
          },
          { $unwind: '$project' },
          { $match: { 'project.masterDevelopment': id } },
          {
            $group: {
              _id: {
                propertyType: '$project.propertyType',
                unitPurpose: '$unitPurpose',
              },
              count: { $sum: 1 },
            },
          },
        ]),
      ]);

      // Safety check
      if (!development) {
        throw new Error('MasterDevelopment not found');
      }

      // === Plot Status Aggregation ===
      const statusMap = { Ready: 0, 'Under Construction': 0, Vacant: 0 };
      let totalPlots = 0;

      [...subDevStatuses, ...projStatuses].forEach(({ _id, count }) => {
        totalPlots += count;
        if (_id && statusMap[_id] !== undefined) {
          statusMap[_id] += count;
        }
      });

      // === Min/Max Stats ===
      const subStats = subDevStatsRaw[0] || {};
      const projStats = projStatsRaw[0] || {};

      const projectMinHeight = Math.min(
        subStats.minHeight ?? Infinity,
        projStats.minHeight ?? Infinity,
      );
      const projectMaxHeight = Math.max(
        subStats.maxHeight ?? -Infinity,
        projStats.maxHeight ?? -Infinity,
      );
      const projectMinBUA = Math.min(
        subStats.minBUA ?? Infinity,
        projStats.minBUA ?? Infinity,
      );
      const projectMaxBUA = Math.max(
        subStats.maxBUA ?? -Infinity,
        projStats.maxBUA ?? -Infinity,
      );

      // === Property Types ===
      const countsByType = propertyTypeCounts.reduce(
        (acc, cur) => {
          acc[cur._id] = cur.count;
          return acc;
        },
        {} as Record<string, number>,
      );

      const apartmentCount = countsByType['Apartment'] || 0;
      const hotelCount = countsByType['Hotel'] || 0;
      const townhouseCount = countsByType['Townhouse'] || 0;
      const villaCount = countsByType['Villas'] || 0;
      const totalCount =
        apartmentCount + hotelCount + townhouseCount + villaCount;

      const [
        apartmentCountType,
        villasCountType,
        hotelCountType,
        townhouseCountType,
        labourCampCountType,
      ] = inventoryCounts;

      // === Availability Formatting ===
      const availabilityResult: Record<string, Record<string, number>> = {};
      const propertyTypes = ['Apartment', 'Villas', 'Townhouses'];
      const statuses = ['Sell', 'Rent'];

      propertyTypes.forEach((type) => {
        availabilityResult[type] = {};
        statuses.forEach((status) => {
          availabilityResult[type][status] = 0;
        });
      });

      availabilityCounts.forEach(({ _id, count }) => {
        const { propertyType, unitPurpose } = _id;
        if (
          availabilityResult[propertyType] &&
          statuses.includes(unitPurpose)
        ) {
          availabilityResult[propertyType][unitPurpose] = count;
        }
      });

      // === Final Response ===
      return {
        roadLocation: development.roadLocation,
        developmentName: development.developmentName,
        developmentRanking: development.locationQuality,
        noOfFacilities: (development.facilitiesCategories || []).length,
        noOfAmenities: (development.amentiesCategories || []).length,
        noOfPlots: totalPlots,
        noOfDevelopedPlots: statusMap['Ready'],
        noOfUnderConstructionPlots: statusMap['Under Construction'],
        noOfVacantPlots: statusMap['Vacant'],
        projectHeight: {
          projectMinHeight,
          projectMaxHeight,
        },
        projectBUA: {
          projectMinBUA,
          projectMaxBUA,
        },
        PropertyTypes: {
          Apartments: apartmentCount,
          Hotels: hotelCount,
          Townhouse: townhouseCount,
          Villas: villaCount,
          total: totalCount,
        },
        InventoryType: {
          apartmentCountType,
          villasCountType,
          hotelCountType,
          townhouseCountType,
          labourCampCountType,
        },
        Availability: availabilityResult,
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Failed to generate report');
    }
  }
}
