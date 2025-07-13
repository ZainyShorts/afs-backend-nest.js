/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { HttpStatusCode } from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as xlsx from 'xlsx'; 
import { Types } from 'mongoose';
import * as fs from 'fs';
import { Inventory } from './schema/inventory.schema';
import { CreateInventorytDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryFilterInput } from './dto/inventoryFilterInput';
import { Customer } from 'src/customer/schema/customer.schema';
import { Project } from 'src/project/schema/project.schema'; 
import { SubDevelopment } from 'src/subdevelopment/schema/subdevelopment.schema';
import { MasterDevelopment } from 'src/masterdevelopment/schema/master-development.schema';
import { RoomType, UnitPurpose, unitType } from 'utils/enum/enums';
import { InventoryHeaderMapping } from 'utils/methods/methods';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(Inventory.name) private inventoryModel: Model<Inventory>,
    @InjectModel(Project.name) private projectModel: Model<Inventory>,
    @InjectModel(SubDevelopment.name)
    private subDevelopmenttModel: Model<Inventory>,
    @InjectModel(MasterDevelopment.name)
    private masterDevelopmentModel: Model<Inventory>, 
    @InjectModel(Customer.name) private customerModel: Model<Customer>, 
  ) {}

  async create(dto: CreateInventorytDto, userId: string): Promise<any> {
    try {
      console.log(userId);
      const exists = await this.inventoryModel.findOne({
        unitNumber: dto.unitNumber,
        project: dto.project,
      });
      console.log(exists);

      if (exists) {
        return {
          success: false,
          msg: 'Unit Number already exists in this project',
        };
      }
      console.log('hiy');
      const created = new this.inventoryModel({
        ...dto,
        user: userId,
        paymentPlan1: {
          developerPrice:
            Array.isArray(dto.paymentPlan1) && dto.paymentPlan1.length === 0
              ? 0
              : Array.isArray(dto.paymentPlan1) && dto.paymentPlan1[0]
                ? dto.paymentPlan1[0]['developerPrice'] || 0
                : 0,
          plan: [],
        },
        paymentPlan2: {
          developerPrice:
            Array.isArray(dto.paymentPlan2) && dto.paymentPlan2.length === 0
              ? 0
              : Array.isArray(dto.paymentPlan2) && dto.paymentPlan2[0]
                ? dto.paymentPlan2[0]['developerPrice'] || 0
                : 0,
          plan: [],
        },
        paymentPlan3: {
          developerPrice:
            Array.isArray(dto.paymentPlan3) && dto.paymentPlan3.length === 0
              ? 0
              : Array.isArray(dto.paymentPlan3) && dto.paymentPlan3[0]
                ? dto.paymentPlan3[0]['developerPrice'] || 0
                : 0,
          plan: [],
        },
      });
      await created.save();
      return {
        success: true,
      };
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

  async deletePlan(docId: string, type: string, index?: number) {
    const document = await this.inventoryModel.findById(docId);
    if (!document) throw new NotFoundException('Inventory not found');

    if (!['paymentPlan1', 'paymentPlan2', 'paymentPlan3'].includes(type)) {
      throw new NotFoundException('Invalid plan type');
    }

    if (index === undefined) {
      // Empty entire plan list
      document[type] = [];
    } else {
      // Remove specific index from the plan list
      if (!document[type][index]) {
        throw new NotFoundException(`Plan at index ${index} not found`);
      }
      document[type].splice(index, 1);
    }

    await document.save();
    return { message: 'Plan updated successfully', updated: document[type] };
  }

  async addPlan(
    docId: string,
    type: 'paymentPlan1' | 'paymentPlan2' | 'paymentPlan3',
    newPlan: any[],
  ) {
    try {
      const document = await this.inventoryModel.findById(docId);
      if (!document) {
        throw new NotFoundException('Inventory not found');
      }

      console.log(type);
      console.log('newPlan', newPlan);
      console.log('document', document);

      if (!document[type] || typeof document[type] !== 'object') {
        throw new BadRequestException(`Invalid payment plan type: ${type}`);
      }

      // Sort by date ascending
      const sortedPlan = newPlan.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Replace the plan
      document[type].plan = sortedPlan;

      console.log(document);

      // 🟡 Force Mongoose to detect changes to nested path
      document.markModified(`${type}.plan`);

      await document.save();
      return document[type];
    } catch (error) {
      console.error('Error updating payment plan:', error);
      throw new InternalServerErrorException(
        error?.message || 'Failed to update payment plan',
      );
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filter?: InventoryFilterInput,
    populate?: string,
  ): Promise<any> {
    try {
      const query: any = {};
      if (filter) {
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

        if (filter.noOfBedRooms) {
          query.noOfBedRooms = filter.noOfBedRooms;
        }

        if (filter.unitInternalDesign) {
          query.unitInternalDesign = {
            $regex: new RegExp(filter.unitInternalDesign, 'i'),
          };
        }

        if (filter.unitExternalDesign) {
          query.unitExternalDesign = {
            $regex: new RegExp(filter.unitExternalDesign, 'i'),
          };
        }

        if (filter.unitHeight) {
          query.unitHeight = { $regex: new RegExp(filter.unitHeight, 'i') };
        }

        if (filter.unitPurpose) {
          query.unitPurpose = filter.unitPurpose;
        }

        if (filter.listingDate) {
          query.listingDate = filter.listingDate;
        }

        if (filter.rentedAt) {
          query.rentedAt = filter.rentedAt;
        }

        if (filter.rentedAt) {
          query.rentedAt = filter.rentedAt;
        }

        if (filter.noOfBedRooms) {
          query.noOfBedRooms = {};
          if (filter.noOfBedRooms.min !== undefined)
            query.noOfBedRooms.$gte = filter.noOfBedRooms.min;
          if (filter.noOfBedRooms.max !== undefined)
            query.noOfBedRooms.$lte = filter.noOfBedRooms.max;
        }

        if (filter.noOfWashroom) {
          query.noOfWashroom = {};
          if (filter.noOfWashroom.min !== undefined)
            query.noOfWashroom.$gte = filter.noOfWashroom.min;
          if (filter.noOfWashroom.max !== undefined)
            query.noOfWashroom.$lte = filter.noOfWashroom.max;
        }

        if (filter.BuaSqFt) {
          query.BuaSqFt = {};
          if (filter.BuaSqFt.min !== undefined)
            query.BuaSqFt.$gte = filter.BuaSqFt.min;
          if (filter.BuaSqFt.max !== undefined)
            query.BuaSqFt.$lte = filter.BuaSqFt.max;
        }

        if (filter.plotSizeSqFt) {
          query.plotSizeSqFt = {};
          if (filter.plotSizeSqFt.min !== undefined)
            query.plotSizeSqFt.$gte = filter.plotSizeSqFt.min;
          if (filter.plotSizeSqFt.max !== undefined)
            query.plotSizeSqFt.$lte = filter.plotSizeSqFt.max;
        }

        if (filter.purchasePriceRange) {
          query.rentalPrice = {};
          if (filter.purchasePriceRange.min !== undefined)
            query.purchasePrice.$gte = filter.purchasePriceRange.min;
          if (filter.purchasePriceRange.max !== undefined)
            query.purchasePrice.$lte = filter.purchasePriceRange.max;
        }

        // Import or define additionalRooms and RoomType at the top of the file:
        // import { additionalRooms, RoomType } from 'utils/enum/enums';
        if (filter.additionalRooms) {
          console.log(filter.additionalRooms);

          for (const amenity of filter.additionalRooms) {
            if (!Object.values(RoomType).includes(amenity as RoomType)) {
              throw new BadRequestException(`Invalid room type: ${amenity}.`);
            }
          }

          query.additionalRooms = { $all: filter.additionalRooms };
        }

        if (filter.askingPriceRange) {
          query.askingPrice = {};
          if (filter.askingPriceRange.min !== undefined)
            query.askingPrice.$gte = filter.askingPriceRange.min;
          if (filter.askingPriceRange.max !== undefined)
            query.askingPrice.$lte = filter.askingPriceRange.max;
        }

        if (filter.marketPriceRange) {
          query.marketPrice = {};
          if (filter.marketPriceRange.min !== undefined)
            query.marketPrice.$gte = filter.marketPriceRange.min;
          if (filter.marketPriceRange.max !== undefined)
            query.marketPrice.$lte = filter.marketPriceRange.max;
        }

        if (filter.premiumAndLossRange) {
          query.premiumAndLoss = {};
          if (filter.premiumAndLossRange.min !== undefined)
            query.premiumAndLoss.$gte = filter.premiumAndLossRange.min;
          if (filter.premiumAndLossRange.max !== undefined)
            query.premiumAndLoss.$lte = filter.premiumAndLossRange.max;
        }

        if (filter.marketRentRange) {
          query.premiumAndLoss = {};
          if (filter.marketRentRange.min !== undefined)
            query.marketRent.$gte = filter.marketRentRange.min;
          if (filter.marketRentRange.max !== undefined)
            query.marketRent.$lte = filter.marketRentRange.max;
        }

        if (filter.askingRentRange) {
          query.premiumAndLoss = {};
          if (filter.askingRentRange.min !== undefined)
            query.askingRent.$gte = filter.askingRentRange.min;
          if (filter.askingRentRange.max !== undefined)
            query.askingRent.$lte = filter.askingRentRange.max;
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

        if (filter.paymentPlan1) {
          query.paymentPlan1 = filter.paymentPlan1;
        }

        if (filter.paymentPlan2) {
          query.paymentPlan2 = filter.paymentPlan2;
        }

        if (filter.paymentPlan3) {
          query.paymentPlan3 = filter.paymentPlan3;
        }
      }

      const sortDirection = sortOrder === 'asc' ? 1 : -1;

      const populateOptions: any = [];

      if (populate) {
        const populateFields = populate.split(',').map((f) => f.trim());

        // If project is requested, handle nested populate inside it
        if (populateFields.includes('project')) {
          const nestedPopulate = [];
          if (populateFields.includes('masterDevelopment')) {
            nestedPopulate.push({
              path: 'masterDevelopment',
              select: 'developmentName roadLocation',
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
        if (populateFields.includes('paymentPlan1')) {
          populateOptions.push({
            path: 'paymentPlan1.plan',
            select: 'date constructionPercent amountt',
          });
        }

        if (populateFields.includes('paymentPlan2')) {
          populateOptions.push({
            path: 'paymentPlan2.plan',
            select: 'date constructionPercent amountt',
          });
        }

        if (populateFields.includes('paymentPlan3')) {
          populateOptions.push({
            path: 'paymentPlan3.plan',
            select: 'date constructionPercent amountt',
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

      let data = await queryBuilder.exec();

      if (filter.developmentName) {
        const masterDevelopmentDocument: MasterDevelopment =
          await this.masterDevelopmentModel
            .findOne({
              developmentName: filter.developmentName,
            })
            .select('developmentName');

        if (masterDevelopmentDocument) {
          console.log('if');
          console.log(data[0]);
          data = data.filter(
            (doc) =>
              doc.project?.masterDevelopment?.developmentName ===
              masterDevelopmentDocument.developmentName,
          );
        } else {
          console.log('else');
          data = [];
        }
      }
      if (filter.roadLocation) {
        const masterDevelopmentDocument: MasterDevelopment =
          await this.masterDevelopmentModel
            .findOne({
              roadLocation: filter.roadLocation,
            })
            .select('roadLocation');
        console.log('masterDevelopmentDocument:', masterDevelopmentDocument);

        if (masterDevelopmentDocument) {
          console.log('Before filter, first item:', data[0]);

          const filterLocation = masterDevelopmentDocument.roadLocation.trim();

          data = data.filter((doc, index) => {
            const docLocation =
              doc.project?.masterDevelopment?.roadLocation?.trim();
            const isMatch = docLocation === filterLocation;

            console.log(
              `Filtering doc[${index}]: docLocation="${docLocation}", filterLocation="${filterLocation}", match=${isMatch}`,
            );

            return isMatch;
          });

          console.log('After filter, first item:', data[0]);
        } else {
          data = [];
        }
      }

      if (filter.subDevelopment) {
        const subDevelopmentDocument: SubDevelopment =
          await this.subDevelopmenttModel
            .findOne({
              subDevelopment: filter.subDevelopment,
            })
            .select('subDevelopment');

        if (subDevelopmentDocument) {
          data = data.filter(
            (doc) =>
              doc.project?.subDevelopment?.subDevelopment ===
              subDevelopmentDocument.subDevelopment,
          );
        } else {
          data = [];
        }
      }

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

  async findOne(id: string): Promise<Inventory> {
    try {
      const inventory = await this.inventoryModel
        .findById(id)
        .populate({
          path: 'project',
          populate: [
            {
              path: 'masterDevelopment',
              model: 'MasterDevelopment',
              select: 'developmentName roadLocation',
            },
            {
              path: 'subDevelopment',
              model: 'SubDevelopment',
              select: 'subDevelopment',
            },
          ],
        })
        .exec();

      if (!inventory) {
        throw new NotFoundException(`Unit with ID ${id} not found`);
      }

      return inventory;
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to find Unit',
      );
    }
  }
  async findOneWithCustomers(id: string): Promise<{
  inventory: Inventory;
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
    const inventory = await this.inventoryModel.findById(id).exec();
    console.log('📦 Fetched inventory:', inventory);

    if (!inventory) {
      console.warn(`⚠️ Inventory not found for ID: ${id}`);
      throw new NotFoundException(`Inventory unit with ID ${id} not found`);
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
  async updateProperty(
    id: string,
    updateData: UpdateInventoryDto,
  ): Promise<any> {
    try {
      // Check if unitNumber already exists for the same project, excluding the current property
      const duplicate = await this.inventoryModel.findOne({
        unitNumber: updateData.unitNumber,
        project: updateData.project,
        _id: { $ne: id }, // Exclude the current property by its ID
      });

      if (duplicate) {
        return {
          success: false,
          msg: 'Unit Number already exists in this project',
          statusCode: HttpStatus.BAD_REQUEST,
        };
      }

      // Preprocess payment plans
      const paymentPlan1 = {
        developerPrice:
          Array.isArray(updateData.paymentPlan1) &&
          updateData.paymentPlan1.length > 0 &&
          updateData.paymentPlan1[0]?.developerPrice
            ? updateData.paymentPlan1[0].developerPrice
            : 0,
        plan: [],
      };

      const paymentPlan2 = {
        developerPrice:
          Array.isArray(updateData.paymentPlan2) &&
          updateData.paymentPlan2.length > 0 &&
          updateData.paymentPlan2[0]?.developerPrice
            ? updateData.paymentPlan2[0].developerPrice
            : 0,
        plan: [],
      };

      const paymentPlan3 = {
        developerPrice:
          Array.isArray(updateData.paymentPlan3) &&
          updateData.paymentPlan3.length > 0 &&
          updateData.paymentPlan3[0]?.developerPrice
            ? updateData.paymentPlan3[0].developerPrice
            : 0,
        plan: [],
      };

      const processedData = {
        ...updateData,
        paymentPlan1,
        paymentPlan2,
        paymentPlan3,
      };

      const updatedProperty = await this.inventoryModel.findByIdAndUpdate(
        id,
        processedData,
        {
          new: true,
          runValidators: true,
        },
      );

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
    } catch (error) {
      console.log(error);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: 'Failed to update property',
      };
    }
  } 



   async removeCustomer(InventoryId: string, customerId: string): Promise<Inventory> {
         try {
           const development = await this.inventoryModel.findById(InventoryId).exec();
       
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
               (assignment) => !(assignment.id === InventoryId && assignment.name === 'inventory'),
             );
       
             await customer.save();
           }
       
           return development;
         } catch (error) {
           console.error('Error removing customer from MasterDevelopment:', error);
           throw new Error('Failed to remove customer from MasterDevelopment');
         }
       }
       async addCustomer(InventoryId: string, customerId: string): Promise<Inventory> {
         try {
           const development = await this.inventoryModel.findById(InventoryId).exec();
       
           if (!development) {
             throw new Error('SubDevlopment not found');
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
             (entry) => entry.id === InventoryId && entry.name === 'inventory'
           );
       
           if (!alreadyAssigned) {
             const newAssignment = {
               id: InventoryId,
               name: 'Inventory',
               propertyName: development.unitNumber,
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
           console.error('Error adding customer to Sub Development:', error);
           throw new Error('Failed to add customer to Sub Development');
         }
       } 

  async import(filePath: string, userId: string): Promise<any> {
    const EXPECTED_HEADERS = [
      'Project',
      'Unit Number',
      'Unit Height',
      'Unit Internal Design',
      'Unit External Design',
      'Plot Size Sq. Ft.',
      'BUA Sq. Ft.',
      'No. of Bedrooms',
      'Unit Type',
      'Rented At',
      'Rented Till',
      'Unit View',
      'Unit Purpose',
      'Listing Date',
      'Purchase Price',
      'Market Price',
      'Asking Price',
      'Premium and Loss',
      'Market Rent',
      'Asking Rent',
      'Paid to Developers',
      'Payable to Developers',
      'Addional Rooms',
      'Addional Rooms 2',
      'Addional Rooms 3',
      'Addional Rooms 4',
      'No. of Washroom',
    ];

    const InventoryHeaderMapping: Record<string, string> = {
      Project: 'project',
      'Unit Number': 'unitNumber',
      'Unit Height': 'unitHeight',
      'Unit Internal Design': 'unitInternalDesign',
      'Unit External Design': 'unitExternalDesign',
      'Plot Size Sq. Ft.': 'plotSizeSqFt',
      'BUA Sq. Ft.': 'BuaSqFt',
      'No. of Bedrooms': 'noOfBedRooms',
      'Unit Type': 'unitType',
      'Rented At': 'rentedAt',
      'Rented Till': 'rentedTill',
      'Unit View': 'unitView',
      'Unit Purpose': 'unitPurpose',
      'Listing Date': 'listingDate',
      'Purchase Price': 'purchasePrice',
      'Market Price': 'marketPrice',
      'Asking Price': 'askingPrice',
      'Premium and Loss': 'premiumAndLoss',
      'Market Rent': 'marketRent',
      'Asking Rent': 'askingRent',
      'Paid to Developers': 'paidTODevelopers',
      'Payable to Developers': 'payableTODevelopers',
      'Addional Rooms': 'addionalRooms',
      'Addional Rooms 2': 'addionalRooms2',
      'Addional Rooms 3': 'addionalRooms3',
      'Addional Rooms 4': 'addionalRooms4',
      'No. of Washroom': 'noOfWashroom',
    };

    console.log(
      `[Import Service] Starting import for file: ${filePath}, user: ${userId}`,
    );

    try {
      console.log(`[Import Service] Reading file from: ${filePath}`);
      const fileBuffer = fs.readFileSync(filePath);
      console.log(
        `[Import Service] File buffer read. Size: ${fileBuffer.length} bytes`,
      );

      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      console.log(`[Import Service] Excel sheet '${sheetName}' loaded.`);

      const jsonData: string[][] = xlsx.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        defval: '',
      });
      console.log(
        `[Import Service] Raw JSON data from sheet (first row):`,
        jsonData[0],
      );

      if (!jsonData[0] || !Array.isArray(jsonData[0])) {
        console.error(
          '[Import Service] Error: Excel file is empty or malformed. No header row found.',
        );
        throw new BadRequestException('Excel file is empty or malformed.');
      }

      const fileHeaders = jsonData[0].map((h) =>
        String(h)
          .replace(/\r?\n|\r/g, '')
          .trim(),
      );
      console.log('[Import Service] File Headers (cleaned):', fileHeaders);
      console.log('[Import Service] Expected Headers:', EXPECTED_HEADERS);

      if (fileHeaders.length !== EXPECTED_HEADERS.length) {
        console.error(
          `[Import Service] Header Mismatch: Number of headers do not match.`,
        );
        console.error(
          `[Import Service] Expected ${EXPECTED_HEADERS.length}, Got ${fileHeaders.length}`,
        );
        return {
          success: false,
          message:
            'Uploaded file headers do not match the required format. Header count mismatch.',
          expectedHeaders: EXPECTED_HEADERS,
          fileHeaders,
        };
      }

      const headersMatch = EXPECTED_HEADERS.every(
        (expected, idx) => expected === fileHeaders[idx],
      );

      if (!headersMatch) {
        console.error(
          '[Import Service] Header Mismatch: Content of headers do not match.',
        );
        console.error(
          '[Import Service] Mismatched Headers (Expected vs File):',
        );
        EXPECTED_HEADERS.forEach((expected, idx) => {
          if (expected !== fileHeaders[idx]) {
            console.error(
              `  Index ${idx}: Expected '${expected}', Got '${fileHeaders[idx]}'`,
            );
          }
        });

        return {
          success: false,
          message:
            'Uploaded file headers do not match the required format. Content mismatch.',
          expectedHeaders: EXPECTED_HEADERS,
          fileHeaders,
        };
      }
      console.log('[Import Service] Headers matched successfully.');

      const rowData = xlsx.utils.sheet_to_json(sheet, {
        raw: false,
        defval: '',
      });
      console.log(
        `[Import Service] Total rows read from file (excluding header): ${rowData.length}`,
      );

      const requiredFields = [
        'project',
        'unitNumber',
        'unitType',
        'unitPurpose',
      ];
      const validRows: any[] = [];
      const invalidRows: any[] = [];

      console.log('[Import Service] Fetching project names from database...');
      const projectNames = [
        ...new Set(rowData.map((row: any) => row['Project'])),
      ];
      const projects = await this.projectModel
        .find({ projectName: { $in: projectNames } })
        .lean();
      const projectMap = new Map(
        projects.map((p: any) => [p.projectName, p._id.toString()]),
      );
      console.log(
        `[Import Service] Found ${projects.length} matching projects in DB.`,
      );
      if (projectNames.length > projects.length) {
        const missingProjects = projectNames.filter(
          (name) => !projectMap.has(name),
        );
        console.warn(
          `[Import Service] Some projects from Excel not found in DB:`,
          missingProjects,
        );
      }

      rowData.forEach((row: any, index: number) => {
        const rowNumber = index + 2;
        const formattedRow: any = {};
        let rowErrors: string[] = [];

        for (const key in row) {
          const cleanedKey = String(key)
            .replace(/\r?\n|\r/g, '')
            .trim();
          const mappedKey = InventoryHeaderMapping[cleanedKey];
          if (mappedKey) {
            formattedRow[mappedKey] = row[key];
          } else {
          }
        }

        const originalProjectName = row['Project'];
        if (!originalProjectName) {
          rowErrors.push(`Missing 'Project' name.`);
        } else if (!projectMap.has(originalProjectName)) {
          rowErrors.push(
            `Project '${originalProjectName}' not found in the database.`,
          );
        } else {
          formattedRow.project = projectMap.get(originalProjectName);
        }

        formattedRow.user = userId;

        if (
          formattedRow.unitView &&
          typeof formattedRow.unitView === 'string'
        ) {
          formattedRow.unitView = formattedRow.unitView
            .split(',')
            .map((v: string) => v.trim())
            .filter((v) => v !== '');
        } else {
          formattedRow.unitView = [];
        }

        if (
          formattedRow.unitNumber === undefined ||
          formattedRow.unitNumber === null ||
          formattedRow.unitNumber === ''
        ) {
          formattedRow.unitNumber = '0';
        } else {
          formattedRow.unitNumber = String(formattedRow.unitNumber).trim();
        }

        if (
          formattedRow.purchasePrice !== undefined &&
          formattedRow.purchasePrice !== '' &&
          formattedRow.marketPrice !== undefined &&
          formattedRow.marketPrice !== '' &&
          !formattedRow.premiumAndLoss
        ) {
          const purchase = Number(formattedRow.purchasePrice);
          const market = Number(formattedRow.marketPrice);
          if (!isNaN(purchase) && !isNaN(market)) {
            formattedRow.premiumAndLoss = purchase - market;
          } else {
          }
        }

        if (!Object.values(unitType).includes(formattedRow.unitType)) {
          rowErrors.push(
            `Invalid unitType: '${formattedRow.unitType}'. Expected one of: ${Object.values(unitType).join(', ')}`,
          );
        }

        if (!Object.values(UnitPurpose).includes(formattedRow.unitPurpose)) {
          formattedRow.unitPurpose = 'Pending';
        }

        const washroomVal = formattedRow.noOfWashroom;
        if (washroomVal !== undefined && washroomVal !== '') {
          const parsed = Number(washroomVal);
          formattedRow.noOfWashroom = isNaN(parsed) ? null : parsed;
          if (isNaN(parsed)) {
          }
        } else {
          formattedRow.noOfWashroom = null;
        }

        formattedRow.additionalRooms = [
          formattedRow.addionalRooms,
          formattedRow.addionalRooms2,
          formattedRow.addionalRooms3,
          formattedRow.addionalRooms4,
        ].filter((val) => typeof val === 'string' && val.trim() !== '');

        [
          'addionalRooms',
          'addionalRooms2',
          'addionalRooms3',
          'addionalRooms4',
        ].forEach((k) => {
          if (formattedRow.hasOwnProperty(k)) {
            delete formattedRow[k];
          }
        });

        const missingFields = requiredFields.filter(
          (field) =>
            formattedRow[field] === undefined ||
            formattedRow[field] === null ||
            formattedRow[field] === '',
        );

        if (missingFields.length > 0) {
          rowErrors.push(
            `Missing required fields: ${missingFields.join(', ')}`,
          );
        }

        if (rowErrors.length > 0) {
          invalidRows.push({
            index: rowNumber,
            error: rowErrors.join('; '),
            row: formattedRow,
          });
          console.warn(
            `[Import Service] Row ${rowNumber} is INVALID: ${rowErrors.join('; ')}`,
          );
        } else {
          validRows.push(formattedRow);
        }
      });

      console.log(
        `[Import Service] Finished processing all rows. Valid rows: ${validRows.length}, Invalid rows: ${invalidRows.length}`,
      );

      if (validRows.length === 0) {
        console.warn('[Import Service] No valid rows found for insertion.');
        return {
          success: true,
          totalEntries: rowData.length,
          insertedEntries: 0,
          skippedDuplicateEntries: 0,
          skippedInvalidEntries: invalidRows.length,
          invalidRows,
        };
      }

      console.log(
        '[Import Service] Checking for existing units to prevent duplicates...',
      );
      const projectUnitPairs = validRows.map((row) => ({
        project: row.project,
        unitNumber: row.unitNumber.trim(),
      }));

      const projectIds = [...new Set(projectUnitPairs.map((p) => p.project))];
      const existingUnits = await this.inventoryModel.find({
        project: { $in: projectIds },
      });
      const existingSet = new Set(
        existingUnits.map((u) => `${u.project.toString()}-${u.unitNumber}`),
      );
      console.log(
        `[Import Service] Found ${existingUnits.length} existing units in DB.`,
      );

      let duplicates = 0;
      const filteredData = validRows.filter((row, idx) => {
        // Added idx for unique logging
        const key = `${row.project}-${row.unitNumber.trim()}`;
        if (existingSet.has(key)) {
          duplicates++;
          console.warn(
            `[Import Service] Skipping duplicate (before insert): Row #${idx + 1} (Unit: ${row.unitNumber}) for Project ID '${row.project}'`,
          );
          return false;
        }
        existingSet.add(key);
        return true;
      });

      console.log(
        `[Import Service] Filtered out ${duplicates} duplicate entries. Remaining for insertion: ${filteredData.length}`,
      );

      if (filteredData.length > 0) {
        console.log(
          '\n--- [Import Service] Final data rows ready for insertion (excluding duplicates) ---',
        );
        filteredData.forEach((row, index) => {
          console.log(
            `[Import Service] Row ${index + 1} for insert:`,
            JSON.stringify(row),
          );
        });
        console.log('--- End of final data rows for insertion ---');
      }
      // --- END NEW LOG ---

      let insertedDataCount = 0;
      const chunkSize = 5000;
      for (let i = 0; i < filteredData.length; i += chunkSize) {
        const chunk = filteredData.slice(i, i + chunkSize);
        console.log(
          `[Import Service] Attempting to insert chunk ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(filteredData.length / chunkSize)} (size: ${chunk.length}).`,
        );
        try {
          const result = await this.inventoryModel.insertMany(chunk, {
            ordered: false,
          });
          insertedDataCount += result.length;
          console.log(
            `[Import Service] Chunk inserted successfully. Inserted ${result.length} documents.`,
          );
        } catch (err: any) {
          console.error(
            `[Import Service] Error: Chunk insert failed at index ${i}. Error details:`,
            err,
          );
          if (err.writeErrors && Array.isArray(err.writeErrors)) {
            err.writeErrors.forEach((writeError: any) => {
              console.error(
                `  Write Error Code: ${writeError.code}, Message: ${writeError.errmsg}, Index: ${writeError.index}`,
              );
            });
          }
        }
      }

      console.log(`[Import Service] Import process finished.`);
      return {
        success: true,
        totalEntries: rowData.length,
        insertedEntries: insertedDataCount,
        skippedDuplicateEntries: duplicates,
        skippedInvalidEntries: invalidRows.length,
        invalidRows,
      };
    } catch (error: any) {
      console.error(`[Import Service] Uncaught error during import:`, error);
      throw new InternalServerErrorException(
        error?.message ||
          'Failed to import inventory due to an unexpected error.',
      );
    } finally {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`[Import Service] Temporary file deleted: ${filePath}`);
        } catch (e: any) {
          console.error(
            '[Import Service] Failed to delete temporary file:',
            e?.message || e,
          );
        }
      }
      console.log(`[Import Service] Import process cleanup complete.`);
    }
  }
}
