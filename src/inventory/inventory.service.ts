/* eslint-disable @typescript-eslint/no-unused-vars */
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
  // async findAll(
  //   page = 1,
  //   limit = 10,
  //   sortBy = 'createdAt',
  //   sortOrder = 'desc',
  //   filter?: InventoryFilterInput,
  //   populate?: string,
  // ): Promise<any> {
  //   try {
  //     const query: any = {};
  //     const sortDirection = sortOrder === 'asc' ? 1 : -1;
  //     const projectIds: Set<string> = new Set();

  //     if (filter) {
  //       // Apply projectName filter
  //       if (filter.project) {
  //         const projectDoc = await this.projectModel
  //           .findOne({ projectName: filter.project })
  //           .select('_id');
  //         if (projectDoc) projectIds.add(projectDoc._id.toString());
  //       }

  //       // developmentName filter
  //       if (filter.developmentName) {
  //         const masterDev = await this.masterDevelopmentModel
  //           .findOne({ developmentName: filter.developmentName })
  //           .select('_id');
  //         if (masterDev) {
  //           const relatedProjects = await this.projectModel
  //             .find({ masterDevelopment: masterDev._id })
  //             .select('_id');
  //           relatedProjects.forEach((p) => projectIds.add(p._id.toString()));
  //         }
  //       }

  //       // roadLocation filter
  //       if (filter.roadLocation) {
  //         const masterDev = await this.masterDevelopmentModel
  //           .findOne({ roadLocation: filter.roadLocation })
  //           .select('_id');
  //         if (masterDev) {
  //           const relatedProjects = await this.projectModel
  //             .find({ masterDevelopment: masterDev._id })
  //             .select('_id');
  //           relatedProjects.forEach((p) => projectIds.add(p._id.toString()));
  //         }
  //       }

  //       // subDevelopment filter
  //       if (filter.subDevelopment) {
  //         const subDev = await this.subDevelopmenttModel
  //           .findOne({ subDevelopment: filter.subDevelopment })
  //           .select('_id');
  //         if (subDev) {
  //           const relatedProjects = await this.projectModel
  //             .find({ subDevelopment: subDev._id })
  //             .select('_id');
  //           relatedProjects.forEach((p) => projectIds.add(p._id.toString()));
  //         }
  //       }

  //       if (projectIds.size > 0) {
  //         query.project = { $in: Array.from(projectIds) };
  //       }

  //       // Simple filters
  //       if (filter.unitNumber) query.unitNumber = filter.unitNumber;
  //       if (filter.unitPurpose) query.unitPurpose = filter.unitPurpose;
  //       if (filter.unitInternalDesign)
  //         query.unitInternalDesign = {
  //           $regex: new RegExp(filter.unitInternalDesign, 'i'),
  //         };
  //       if (filter.unitExternalDesign)
  //         query.unitExternalDesign = {
  //           $regex: new RegExp(filter.unitExternalDesign, 'i'),
  //         };
  //       if (filter.unitHeight)
  //         query.unitHeight = { $regex: new RegExp(filter.unitHeight, 'i') };
  //       if (filter.listingDate) query.listingDate = filter.listingDate;
  //       if (filter.rentedAt) query.rentedAt = filter.rentedAt;

  //       // Range filters
  //       if (filter.noOfBedRooms) {
  //         query.noOfBedRooms = {};
  //         if (filter.noOfBedRooms.min !== undefined)
  //           query.noOfBedRooms.$gte = filter.noOfBedRooms.min;
  //         if (filter.noOfBedRooms.max !== undefined)
  //           query.noOfBedRooms.$lte = filter.noOfBedRooms.max;
  //       }
  //       if (filter.BuaSqFt) {
  //         query.BuaSqFt = {};
  //         if (filter.BuaSqFt.min !== undefined)
  //           query.BuaSqFt.$gte = filter.BuaSqFt.min;
  //         if (filter.BuaSqFt.max !== undefined)
  //           query.BuaSqFt.$lte = filter.BuaSqFt.max;
  //       }
  //       if (filter.plotSizeSqFt) {
  //         query.plotSizeSqFt = {};
  //         if (filter.plotSizeSqFt.min !== undefined)
  //           query.plotSizeSqFt.$gte = filter.plotSizeSqFt.min;
  //         if (filter.plotSizeSqFt.max !== undefined)
  //           query.plotSizeSqFt.$lte = filter.plotSizeSqFt.max;
  //       }
  //       if (filter.purchasePriceRange) {
  //         query.purchasePrice = {};
  //         if (filter.purchasePriceRange.min !== undefined)
  //           query.purchasePrice.$gte = filter.purchasePriceRange.min;
  //         if (filter.purchasePriceRange.max !== undefined)
  //           query.purchasePrice.$lte = filter.purchasePriceRange.max;
  //       }
  //       if (filter.askingPriceRange) {
  //         query.askingPrice = {};
  //         if (filter.askingPriceRange.min !== undefined)
  //           query.askingPrice.$gte = filter.askingPriceRange.min;
  //         if (filter.askingPriceRange.max !== undefined)
  //           query.askingPrice.$lte = filter.askingPriceRange.max;
  //       }
  //       if (filter.marketPriceRange) {
  //         query.marketPrice = {};
  //         if (filter.marketPriceRange.min !== undefined)
  //           query.marketPrice.$gte = filter.marketPriceRange.min;
  //         if (filter.marketPriceRange.max !== undefined)
  //           query.marketPrice.$lte = filter.marketPriceRange.max;
  //       }
  //       if (filter.premiumAndLossRange) {
  //         query.premiumAndLoss = {};
  //         if (filter.premiumAndLossRange.min !== undefined)
  //           query.premiumAndLoss.$gte = filter.premiumAndLossRange.min;
  //         if (filter.premiumAndLossRange.max !== undefined)
  //           query.premiumAndLoss.$lte = filter.premiumAndLossRange.max;
  //       }
  //       if (filter.marketRentRange) {
  //         query.marketRent = {};
  //         if (filter.marketRentRange.min !== undefined)
  //           query.marketRent.$gte = filter.marketRentRange.min;
  //         if (filter.marketRentRange.max !== undefined)
  //           query.marketRent.$lte = filter.marketRentRange.max;
  //       }
  //       if (filter.askingRentRange) {
  //         query.askingRent = {};
  //         if (filter.askingRentRange.min !== undefined)
  //           query.askingRent.$gte = filter.askingRentRange.min;
  //         if (filter.askingRentRange.max !== undefined)
  //           query.askingRent.$lte = filter.askingRentRange.max;
  //       }
  //       if (filter.startDate || filter.endDate) {
  //         query.createdAt = {};
  //         if (filter.startDate)
  //           query.createdAt.$gte = new Date(filter.startDate);
  //         if (filter.endDate) query.createdAt.$lte = new Date(filter.endDate);
  //       }
  //     }

  //     const totalCount = await this.inventoryModel.countDocuments(query);

  //     let queryBuilder = this.inventoryModel
  //       .find(query)
  //       .sort({ [sortBy]: sortDirection })
  //       .skip((page - 1) * limit)
  //       .limit(limit);

  //     if (populate) {
  //       const populateFields = populate.split(',').map((f) => f.trim());
  //       const populateOptions: any = [];

  //       if (populateFields.includes('project')) {
  //         const nestedPopulate = [];
  //         if (populateFields.includes('masterDevelopment')) {
  //           nestedPopulate.push({
  //             path: 'masterDevelopment',
  //             select: 'developmentName roadLocation',
  //           });
  //         }
  //         if (populateFields.includes('subDevelopment')) {
  //           nestedPopulate.push({
  //             path: 'subDevelopment',
  //             select: 'subDevelopment',
  //           });
  //         }
  //         populateOptions.push({
  //           path: 'project',
  //           select: 'projectName masterDevelopment subDevelopment',
  //           populate: nestedPopulate.length ? nestedPopulate : undefined,
  //         });
  //       }

  //       populateOptions.forEach((opt) => {
  //         queryBuilder = queryBuilder.populate(opt);
  //       });
  //     }

  //     const data = await queryBuilder.exec();

  //     return {
  //       data,
  //       totalCount,
  //       totalPages: Math.ceil(totalCount / limit),
  //       pageNumber: page,
  //     };
  //   } catch (error) {
  //     console.error('Error fetching Inventory:', error);
  //     throw new InternalServerErrorException(
  //       error?.message || 'An error occurred while fetching Inventory.',
  //     );
  //   }
  // }

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

  async import(filePath: string): Promise<any> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      const projectNamelist: string[] = [];
      console.log('records length ', sheetData.length);
      const toCamelCase = (str: string) =>
        str
          .replace(/\s(.)/g, (match) => match.toUpperCase())
          .replace(/\s/g, '')
          .replace(/^(.)/, (match) => match.toLowerCase());

      const formattedSheetData = sheetData.map((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach((key) => {
          let camelKey = toCamelCase(key);

          // Special case for 'plotSizeSq.Ft.'
          if (camelKey === 'plotSizeSq.Ft.') {
            camelKey = 'plotSizeSqFt';
            newRow[camelKey] = row[key];
            return;
          }

          if (camelKey === 'bUASq.Ft.') {
            camelKey = 'bUASqFt';
            newRow[camelKey] = row[key];
            return;
          }

          if (camelKey === 'no.OfBedRooms') {
            camelKey = 'noOfBedRooms';
            newRow[camelKey] = row[key];
            return;
          }

          if (camelKey === 'purpose') {
            camelKey = 'unitPurpose';
            newRow[camelKey] = row[key];
            return;
          }

          if (camelKey === 'unitView') {
            const unitViewList = row[key];
            if (unitViewList.includes(',')) {
              const list = unitViewList.split(',');
              newRow[camelKey] = list;
              return;
            } else {
              newRow[camelKey] = [row[key]];
              return;
            }
          }

          newRow[camelKey] = row[key];
        });
        return newRow;
      });

      // console.log(formattedSheetData);

      // return formattedSheetData;
      console.log(`Rows extracted from Excel: ${formattedSheetData.length}`);

      const insertion = [];

      for (const [index, data] of formattedSheetData.entries()) {
        // Validate required fields

        // if (!data.unitNumber) {
        //   return {
        //     success: false,
        //     msg: `Missing value of Unit Number row: ${index}`,
        //   };
        // }

        // if (!data.unitPurpose) {
        //   return {
        //     success: false,
        //     msg: `Missing value of Unit Purpose row: ${index}`,
        //   };
        // }

        // if (data.plotSizeSqFt && typeof data.plotSizeSqFt == 'string') {
        //   return {
        //     success: false,
        //     msg: `Invalid type of Plot Size SqFt row: ${index}`,
        //   };
        // }

        // if (data.plotSizeSqFt && typeof data.plotSizeSqFt == 'string') {
        //   return {
        //     success: false,
        //     msg: `Invalid type of Plot Size SqFt row: ${index}`,
        //   };
        // }

        // if (data.BuaSqFt && typeof data.BuaSqFt == 'string') {
        //   return {
        //     success: false,
        //     msg: `Invalid type of BuaSqFt row: ${index}`,
        //   };
        // }

        if (data.noOfBedRooms) {
          const randomDigit = Math.floor(Math.random() * 3) + 1;
          data.noOfBedRooms = randomDigit;
        } else {
          data.noOfBedRooms = 1;
        }

        // if (data.noOfBedRooms && typeof data.noOfBedRooms == 'string') {
        //   return {
        //     success: false,
        //     msg: `Invalid type of noOfBedRooms row: ${index}`,
        //   };
        // }

        // if (data.rentalPrice && typeof data.rentalPrice == 'string') {
        //   return {
        //     success: false,
        //     msg: `Invalid type of rentalPrice row: ${index}`,
        //   };
        // }

        // if (data.salePrice && typeof data.salePrice == 'string') {
        //   return {
        //     success: false,
        //     msg: `Invalid type of salePrice row: ${index}`,
        //   };
        // }

        // if (data.originalPrice && typeof data.originalPrice == 'string') {
        //   return {
        //     success: false,
        //     msg: `Invalid type of originalPrice row: ${index}`,
        //   };
        // }

        // if (data.premiumAndLoss && typeof data.premiumAndLoss == 'string') {
        //   return {
        //     success: false,
        //     msg: `Invalid type of premiumAndLoss row: ${index}`,
        //   };
        // }

        // Parse unitView string to array, splitting by comma if needed
        let unitViewArray: string[] = [];
        if (data.unitView) {
          if (typeof data.unitView === 'string') {
            unitViewArray = data.unitView
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean);
          } else if (Array.isArray(data.unitView)) {
            unitViewArray = data.unitView;
          }
        }

        if (data.projectName) projectNamelist.push(data.projectName);

        insertion.push({
          projectName: data.projectName,
          unitNumber: data.unitNumber,
          unitHeight: data.unitHeight,
          unitPurpose: data.unitPurpose,
          unitInternalDesign: data.unitInternalDesign,
          unitExternalDesign: data.unitExternalDesign,
          plotSizeSqFt: data.plotSizeSqFt,
          BuaSqFt: data.BuaSqFt,
          noOfBedRooms: data.noOfBedRooms,
          unitType: data.unitType,
          unitView: unitViewArray,
          listingDate: data.listingDate,
          rentalPrice: data.rentalPrice,
          salePrice: data.salePrice,
          rentedAt: data.rentedAt,
          rentedTill: data.rentedTill,
          pruchasePrice: data.purchasePrice,
          marketPrice: data.marketPrice,
          askingPrice: data.askingPrice,
          marketRent: data.marketRent,
          askingRent: data.askingRent,
          paidTODevelopers: data.paidTODevelopers,
          payableTODevelopers: data.payableTODevelopers,
          premiumAndLoss: data.premiumAndLoss,
        });
      }

      console.log(insertion.length, 'insertion');

      console.log(projectNamelist);
      const projectsListDocument: any[] = await this.projectModel
        .find({
          projectName: { $in: projectNamelist },
        })
        .select('_id, projectName');
      console.log(projectsListDocument);

      const updatedDocumentList = [];
      for (let i = 0; i < projectsListDocument.length; i++) {
        for (let j = 0; j < insertion.length; j++) {
          // console.log(insertion[j].projectName);
          if (
            insertion[j].projectName === projectsListDocument[i].projectName
          ) {
            const { projectName, ...obj } = insertion[j];
            const data = {
              ...obj,
              project: projectsListDocument[i]._id,
            };
            updatedDocumentList.push(data);
          }
        }
      }

      // return updatedDocumentList;
      console.log(
        `Records to insert after filtering: ${updatedDocumentList.length}`,
      );

      const BATCH_SIZE = 5000;
      let batchCount = 0;

      for (let i = 0; i < updatedDocumentList.length; i += BATCH_SIZE) {
        const batch = updatedDocumentList.slice(i, i + BATCH_SIZE);
        await this.inventoryModel.insertMany(batch);
        batchCount++;
        console.log(`Inserted batch ${batchCount}, Records: ${batch.length}`);
      }

      console.log('All records inserted successfully!');

      return {
        success: true,
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
