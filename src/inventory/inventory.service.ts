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
import * as fs from 'fs';
import { Inventory } from './schema/inventory.schema';
import { CreateInventorytDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { InventoryFilterInput } from './dto/inventoryFilterInput';
import { Project } from 'src/project/schema/project.schema';
import { SubDevelopment } from 'src/subdevelopment/schema/subdevelopment.schema';
import { MasterDevelopment } from 'src/masterdevelopment/schema/master-development.schema';
import { chooseContentTypeForSingleResultResponse } from '@apollo/server/dist/esm/ApolloServer';
import { UnitPurpose, unitType } from 'utils/enum/enums';
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

  // async updateProperty(
  //   id: string,
  //   updateData: UpdateInventoryDto,
  // ): Promise<any> {
  //   try {

  //     // Preprocess paymentPlan1
  //     const paymentPlan1 = {
  //       developerPrice:
  //         Array.isArray(updateData.paymentPlan1) &&
  //         updateData.paymentPlan1.length > 0 &&
  //         updateData.paymentPlan1[0]?.developerPrice
  //           ? updateData.paymentPlan1[0].developerPrice
  //           : 0,
  //       plan: [],
  //     };

  //     // Preprocess paymentPlan2
  //     const paymentPlan2 = {
  //       developerPrice:
  //         Array.isArray(updateData.paymentPlan2) &&
  //         updateData.paymentPlan2.length > 0 &&
  //         updateData.paymentPlan2[0]?.developerPrice
  //           ? updateData.paymentPlan2[0].developerPrice
  //           : 0,
  //       plan: [],
  //     };

  //     // Preprocess paymentPlan3
  //     const paymentPlan3 = {
  //       developerPrice:
  //         Array.isArray(updateData.paymentPlan3) &&
  //         updateData.paymentPlan3.length > 0 &&
  //         updateData.paymentPlan3[0]?.developerPrice
  //           ? updateData.paymentPlan3[0].developerPrice
  //           : 0,
  //       plan: [],
  //     };

  //     const processedData = {
  //       ...updateData,
  //       paymentPlan1,
  //       paymentPlan2,
  //       paymentPlan3,
  //     };

  //     const updatedProperty = await this.inventoryModel.findByIdAndUpdate(
  //       id,
  //       processedData,
  //       {
  //         new: true,
  //         runValidators: true,
  //       },
  //     );

  //     if (!updatedProperty) {
  //       return {
  //         success: false,
  //         msg: 'Property not found',
  //       };
  //     }

  //     return {
  //       success: true,
  //       msg: 'Property updated successfully',
  //       data: updatedProperty,
  //     };
  //   } catch (error) {
  //     console.log(error);
  //     return {
  //       success: false,
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       msg: 'Failed to update property',
  //     };
  //   }
  // }

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
    ];

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      const fileHeaders = jsonData[0].map((h: any) => String(h).trim());
      const headersMatch = EXPECTED_HEADERS.every(
        (expected, idx) => expected === fileHeaders[idx],
      );

      if (!headersMatch) {
        return {
          success: false,
          message: 'Uploaded file headers do not match the required format.',
          expectedHeaders: EXPECTED_HEADERS,
          fileHeaders,
        };
      }

      // Convert rows to JSON from second row onwards
      const rowData = xlsx.utils.sheet_to_json(sheet);

      const requiredFields = [
        'project',
        'unitNumber',
        'unitType',
        'unitPurpose',
      ];

      const validRows: any[] = [];
      const invalidRows: any[] = [];

      // Get all unique project names from the data
      const projectNames = [
        ...new Set(rowData.map((row: any) => row['Project'])),
      ];

      // Fetch all projects by name
      const projects = await this.projectModel
        .find({
          projectName: { $in: projectNames },
        })
        .lean();

      // Create a map of project names to IDs
      const projectMap = new Map(
        projects.map((project: any) => [
          project.projectName,
          project._id.toString(),
        ]),
      );

      // Check for missing projects
      const missingProjects = projectNames.filter(
        (name) => !projectMap.has(name),
      );
      if (missingProjects.length > 0) {
        return {
          success: false,
          message: 'Some projects not found in the database',
          missingProjects,
        };
      }

      rowData.forEach((row: any, index: number) => {
        const formattedRow: any = {};
        for (const key in row) {
          const cleanedKey = key.replace(/\n/g, '').trim();
          const mappedKey = InventoryHeaderMapping[cleanedKey];
          if (mappedKey) {
            formattedRow[mappedKey] = row[key];
          }
        }

        // Replace project name with project ID
        if (formattedRow.project) {
          formattedRow.project = projectMap.get(formattedRow.project);
        }

        formattedRow.user = userId;

        // Handle unitView as array if it's a string
        if (
          formattedRow.unitView &&
          typeof formattedRow.unitView === 'string'
        ) {
          formattedRow.unitView = formattedRow.unitView
            .split(',')
            .map((v: string) => v.trim());
        }

        // Calculate premium/loss if not provided
        if (formattedRow.purchasePrice && formattedRow.marketPrice) {
          if (!formattedRow.premiumAndLoss) {
            formattedRow.premiumAndLoss =
              Number(formattedRow.purchasePrice) -
              Number(formattedRow.marketPrice);
          }
        }

        const missingFields = requiredFields.filter(
          (field) =>
            formattedRow[field] === undefined ||
            formattedRow[field] === null ||
            formattedRow[field] === '',
        );

        if (missingFields.length > 0) {
          invalidRows.push({ index, missingFields, row: formattedRow });
          return;
        }

        // Validate unitType and unitPurpose
        if (!Object.values(unitType).includes(formattedRow.unitType)) {
          invalidRows.push({
            index,
            error: `Invalid unitType: ${formattedRow.unitType}`,
            row: formattedRow,
          });
          return;
        }

        if (!Object.values(UnitPurpose).includes(formattedRow.unitPurpose)) {
          invalidRows.push({
            index,
            error: `Invalid unitPurpose: ${formattedRow.unitPurpose}`,
            row: formattedRow,
          });
          return;
        }

        validRows.push(formattedRow);
      });

      if (validRows.length === 0) {
        return {
          success: true,
          totalEntries: rowData.length,
          insertedEntries: 0,
          skippedDuplicateEntries: 0,
          skippedInvalidEntries: invalidRows.length,
          invalidRows,
        };
      }

      // Check for existing units in the same project
      const projectUnitPairs = validRows.map((row) => ({
        project: row.project,
        unitNumber: row.unitNumber.trim(),
      }));

      const existingUnits = await this.inventoryModel.find({
        $or: projectUnitPairs,
      });

      const existingSet = new Set(
        existingUnits.map(
          (unit) => `${unit.project.toString()}-${unit.unitNumber}`,
        ),
      );

      let duplicates = 0;
      const filteredData = validRows.filter((row) => {
        const key = `${row.project}-${row.unitNumber.trim()}`;
        if (existingSet.has(key)) {
          duplicates++;
          return false;
        }
        existingSet.add(key);
        return true;
      });

      if (filteredData.length === 0) {
        return {
          success: true,
          totalEntries: rowData.length,
          insertedEntries: 0,
          skippedDuplicateEntries: duplicates,
          skippedInvalidEntries: invalidRows.length,
          invalidRows,
        };
      }

      const chunkSize = 5000;
      let insertedDataCount = 0;

      for (let i = 0; i < filteredData.length; i += chunkSize) {
        const chunk = filteredData.slice(i, i + chunkSize);
        try {
          const result = await this.inventoryModel.insertMany(chunk, {
            ordered: false,
          });
          insertedDataCount += result.length;
        } catch (error) {
          console.error(`Error inserting chunk starting at index ${i}:`, error);
        }
      }

      return {
        success: true,
        totalEntries: rowData.length,
        insertedEntries: insertedDataCount,
        skippedDuplicateEntries: duplicates,
        skippedInvalidEntries: invalidRows.length,
        invalidRows,
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
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        }
      }
    }
  }
}
