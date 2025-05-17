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
          data = data.filter(
            (doc) =>
              doc.project?.masterDevelopment?.developmentName ===
              masterDevelopmentDocument.developmentName,
          );
        } else {
          // If no such masterDevelopment found, no results should match
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
          // If no such masterDevelopment found, no results should match
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

  // async readXlsxAndInsert(filePath: string, clerkId: string): Promise<any> {
  //   try {
  //     const fileBuffer = fs.readFileSync(filePath);
  //     const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

  //     const sheetName = workbook.SheetNames[0];
  //     const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  //     // Function to convert keys to camelCase
  //     const toCamelCase = (str: string) =>
  //       str
  //         .replace(/\s(.)/g, (match) => match.toUpperCase())
  //         .replace(/\s/g, '')
  //         .replace(/^(.)/, (match) => match.toLowerCase());

  //     // Normalize data keys for each row
  //     const formattedSheetData = sheetData.map((row: any) => {
  //       const newRow: any = {};
  //       Object.keys(row).forEach((key) => {
  //         newRow[toCamelCase(key)] = row[key];
  //       });
  //       return newRow;
  //     });

  //     console.log(`Rows extracted from Excel: ${formattedSheetData.length}`);

  //     // Convert data into MongoDB insert format
  //     const insertion = formattedSheetData.map((data: any) => ({
  //       userId: userID(clerkId),
  //       clerkId: clerkId,
  //       roadLocation: data.roadLocation || null,
  //       developmentName: data.developmentName || null,
  //       subDevelopmentName: data.subDevelopmentName || null,
  //       projectName: data.projectName || null,
  //       propertyType: data.propertyType || null,
  //       propertyHeight: data.propertyHeight || null,
  //       projectLocation: data.projectLocation || null,
  //       unitNumber: data.unitNumber || null,
  //       bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
  //       unitLandSize: data.unitLandSize || null,
  //       unitBua: data.unitBua ? Number(data.unitBua) : null,
  //       unitLocation: data.unitLocation || null,
  //       unitView: data.unitView
  //         ? Array.isArray(data.unitView)
  //           ? data.unitView
  //           : [data.unitView]
  //         : [],
  //       propertyImages: data.propertyImages
  //         ? Array.isArray(data.propertyImages)
  //           ? data.propertyImages
  //           : [data.propertyImages]
  //         : [],
  //       Purpose: data.Purpose || null,
  //       vacancyStatus: data.vacancyStatus || null,
  //       primaryPrice: data.primaryPrice ? Number(data.primaryPrice) : null,
  //       resalePrice: data.resalePrice ? Number(data.resalePrice) : null,
  //       premiumAndLoss: data.premiumAndLoss
  //         ? Number(data.premiumAndLoss)
  //         : null,
  //       Rent: data.Rent ? Number(data.Rent) : null,
  //       noOfCheques: data.noOfCheques ? Number(data.noOfCheques) : null,
  //     }));

  //     console.log(`Records to insert: ${insertion.length}`);

  //     // Batch Insert
  //     const BATCH_SIZE = 10000;
  //     let batchCount = 0;

  //     for (let i = 0; i < insertion.length; i += BATCH_SIZE) {
  //       const batch = insertion.slice(i, i + BATCH_SIZE);
  //       await this.inventoryModel.insertMany(batch);
  //       batchCount++;
  //       console.log(`Inserted batch ${batchCount}, Records: ${batch.length}`);
  //     }

  //     console.log('All records inserted successfully!');

  //     return {
  //       success: true,
  //       statusCode: 201,
  //       message: 'All records inserted successfully',
  //     };
  //   } catch (e) {
  //     console.error(e);
  //     throw new HttpException(
  //       'Internal Server Error',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   } finally {
  //     if (filePath) {
  //       fs.unlink(filePath, (err) => {
  //         if (err) console.error('Error deleting file:', err);
  //       });
  //     }
  //   }
  // }
  async import(filePath: string): Promise<any> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });

      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      const projectNamelist: string[] = [];
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

      // return formattedSheetData;
      console.log(`Rows extracted from Excel: ${formattedSheetData.length}`);

      const insertion = [];

      for (const [index, data] of formattedSheetData.entries()) {
        // Validate required fields

        if (!data.unitNumber) {
          return {
            success: false,
            msg: `Missing value of Unit Number row: ${index}`,
          };
        }

        if (!data.unitPurpose) {
          return {
            success: false,
            msg: `Missing value of Unit Purpose row: ${index}`,
          };
        }

        if (data.plotSizeSqFt && typeof data.plotSizeSqFt == 'string') {
          return {
            success: false,
            msg: `Invalid type of Plot Size SqFt row: ${index}`,
          };
        }

        if (data.plotSizeSqFt && typeof data.plotSizeSqFt == 'string') {
          return {
            success: false,
            msg: `Invalid type of Plot Size SqFt row: ${index}`,
          };
        }

        if (data.BuaSqFt && typeof data.BuaSqFt == 'string') {
          return {
            success: false,
            msg: `Invalid type of BuaSqFt row: ${index}`,
          };
        }

        if (data.noOfBedRooms && typeof data.noOfBedRooms == 'string') {
          return {
            success: false,
            msg: `Invalid type of noOfBedRooms row: ${index}`,
          };
        }

        if (data.rentalPrice && typeof data.rentalPrice == 'string') {
          return {
            success: false,
            msg: `Invalid type of rentalPrice row: ${index}`,
          };
        }

        if (data.salePrice && typeof data.salePrice == 'string') {
          return {
            success: false,
            msg: `Invalid type of salePrice row: ${index}`,
          };
        }

        if (data.originalPrice && typeof data.originalPrice == 'string') {
          return {
            success: false,
            msg: `Invalid type of originalPrice row: ${index}`,
          };
        }

        if (data.premiumAndLoss && typeof data.premiumAndLoss == 'string') {
          return {
            success: false,
            msg: `Invalid type of premiumAndLoss row: ${index}`,
          };
        }

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
          unitView: unitViewArray,
          UnitPurpose: data.UnitPurpose,
          listingDate: data.listingDate,
          chequeFrequency: data.chequeFrequency,
          rentalPrice: data.rentalPrice,
          salePrice: data.salePrice,
          rentedAt: data.rentedAt,
          rentedTill: data.rentedTill,
          vacantOn: data.vacantOn,
          originalPrice: data.originalPrice,
          paidTODevelopers: data.paidTODevelopers,
          payableTODevelopers: data.payableTODevelopers,
          premiumAndLoss: data.premiumAndLoss,
        });
      }

      const projectsListDocument: any[] = await this.projectModel
        .find({
          projectName: { $in: projectNamelist },
        })
        .select('_id, projectName');

      const updatedDocumentList = [];
      for (let i = 0; i < projectsListDocument.length; i++) {
        for (let j = 0; j < insertion.length; j++) {
          console.log(insertion[j].projectName);
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
