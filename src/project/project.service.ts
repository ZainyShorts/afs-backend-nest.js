import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Project, ProjectDocument } from './schema/project.schema';
import {
  Inventory,
  InventoryDocument,
} from '../inventory/schema/inventory.schema';
import { Connection, Model } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectFilterInput } from './dto/project-filter.input';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const EXPECTED_HEADERS = [
  'Commission  %',
  'Project  Quality',
  'Construction Status',
  'Launch  Date',
  'Completion Date',
  'Sales  Status',
  'Down  Payment',
  'During  Construction',
  'Upon  Completion',
  'Post  Handover',
  'Listing  Date',
  'Property  Type 1',
  'Property  Type 2',
  'Property  Type 3',
  'Property  Type 4',
  'Property  Type 5',
  'Project  Height',
  'Master  Development',
  'Sub  Development',
  'Project Name',
];

// Utility to convert header to camelCase
const toCamelCase = (str: string): string =>
  str
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+/g, '');

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Inventory.name)
    private inventoryModel: Model<InventoryDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    try {
      // Check if project with the same name already exists
      const existingProject = await this.projectModel.findOne({
        projectName: createProjectDto.projectName,
      });
      if (existingProject) {
        throw new ConflictException('Project name already exists');
      }

      // Create new project
      const createdProject = new this.projectModel(createProjectDto);
      return await createdProject.save();
    } catch (error) {
      if (error?.response?.statusCode == 409) {
        throw new ConflictException(error.response.message);
      }
      // You can customize error handling further if needed
      throw new InternalServerErrorException(
        error.message || 'Failed to create project',
      );
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filter?: ProjectFilterInput,
    populate?: string,
    fields?: string,
  ): Promise<any> {
    try {
      const query: any = {};

      if (filter) {
        console.log(filter);
        // Plot filters
        // if (filter.plotNumber !== undefined) {
        //   query['plot.plotNumber'] = filter.plotNumber;
        // }

        if (filter.plotStatus) {
          query['plot.plotStatus'] = filter.plotStatus;
        }

        // if (filter.plotPermission?.length > 0) {
        //   query['plot.plotPermission'] = { $in: filter.plotPermission };
        // }
        console.log(filter.plotPermission);
        // if (filter.plotPermission) {
        //   query['plot.plotPermission'] = { $in: filter.plotPermission };
        // }
        if (filter.plotPermission) {
          // Guarantee we’re working with an array
          const permissions = Array.isArray(filter.plotPermission)
            ? filter.plotPermission // already an array
            : [filter.plotPermission]; // wrap single value

          query['plot.plotPermission'] = { $in: permissions };
        }

        // Other Project filters
        if (filter.propertyType) {
          query.propertyType = filter.propertyType;
        }

        if (filter.projectName) {
          query.projectName = { $regex: new RegExp(filter.projectName, 'i') };
        }

        if (filter.projectQuality) {
          query.projectQuality = filter.projectQuality;
        }

        if (filter.constructionStatus !== undefined) {
          query.constructionStatus = filter.constructionStatus;
        }

        if (filter.facilityCategories?.length > 0) {
          query.facilityCategories = { $in: filter.facilityCategories };
        }

        if (filter.amenitiesCategories?.length > 0) {
          query.amenitiesCategories = { $in: filter.amenitiesCategories };
        }

        if (filter.launchDate) {
          query.launchDate = filter.launchDate;
        }

        if (filter.height) {
          query.height = filter.height;
        }

        if (filter.commission) {
          query.commission = filter.commission;
        }

        if (filter.duringConstruction) {
          query.height = filter.duringConstruction;
        }

        if (filter.completionDate) {
          query.completionDate = filter.completionDate;
        }

        if (filter.uponCompletion) {
          query.uponCompletion = filter.uponCompletion;
          console.log(query);
        }

        // if (filter.installmentDate) {
        //   query.installmentDate = filter.installmentDate;
        // }

        if (filter.postHandOver) {
          query.postHandOver = filter.postHandOver;
        }

        if (filter.salesStatus) {
          query.salesStatus = filter.salesStatus;
        }

        if (filter.percentOfConstruction) {
          query.percentOfConstruction = filter.percentOfConstruction;
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

      const totalCount =
        Object.keys(query).length > 0
          ? await this.projectModel.countDocuments(query)
          : await this.projectModel.estimatedDocumentCount();

      let populateFields = [];
      if (populate) {
        populateFields = populate.split(',').map((field) => field.trim());
      }
      const projection = fields ? fields.split(',').join(' ') : '';
      let data = await this.projectModel
        .find(query)
        .select(projection)
        .populate(populateFields)
        .sort({ [sortBy]: sortDirection })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      if (filter.masterDevelopment) {
        data = data.filter((item) => {
          const regex = new RegExp(filter.masterDevelopment, 'i');
          return regex.test(item.masterDevelopment?.developmentName || '');
        });
      }

      if (filter.subDevelopment) {
        populateFields.push('subDevelopment');
        data = data.filter((item) => {
          const regex = new RegExp(filter.subDevelopment, 'i');
          return regex.test(item.subDevelopment?.subDevelopment || '');
        });
      }

      // console.log(data);

      return {
        data,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        pageNumber: page,
      };
    } catch (error) {
      console.error('Error fetching Projects:', error);
      throw new InternalServerErrorException(
        error?.message || 'An error occurred while fetching Projects.',
      );
    }
  }

  async findOne(id: string, populateFields?: string[]): Promise<Project> {
    try {
      let query = this.projectModel.findById(id);

      // Dynamically populate if fields are provided
      if (populateFields && populateFields.length > 0) {
        populateFields.forEach((field) => {
          query = query.populate(field);
        });
      }

      const project = await query.exec();

      if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }

      return project;
    } catch (error) {
      throw new InternalServerErrorException(
        error.message || 'Failed to find project',
      );
    }
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    try {
      const project = await this.projectModel.findById(id);

      if (!project) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }

      if (
        updateProjectDto.projectName &&
        updateProjectDto.projectName != project.projectName
      ) {
        const exists = await this.projectModel.findOne({
          developmentName: updateProjectDto.projectName,
        });
        if (exists) {
          throw new ConflictException(
            'A record with the same Project Name already exists.',
          );
        }
      }

      // If projectName is being updated, check for uniqueness
      if (
        updateProjectDto.projectName &&
        updateProjectDto.projectName !== project.projectName
      ) {
        const existing = await this.projectModel.findOne({
          projectName: updateProjectDto.projectName,
        });
        if (existing) {
          throw new ConflictException(
            `Project name "${updateProjectDto.projectName}" already exists`,
          );
        }
      }

      Object.assign(project, updateProjectDto); // Merge updates into the existing project
      return await project.save();
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error.message || 'Failed to update project',
      );
    }
  }

  // auto-save off
  async getInventorySummary(projectId: string) {
    const inventoryStats = await this.inventoryModel.aggregate([
      {
        $match: {
          project: projectId, // Fixed: match string
        },
      },
      {
        $project: {
          unitType: {
            $switch: {
              branches: [
                { case: { $eq: ['$unitType', 'BedRoom'] }, then: 'BR' },
                { case: { $eq: ['$unitType', 'Bedroom'] }, then: 'BR' },
                { case: { $eq: ['$unitType', 'Studio'] }, then: 'Studios' },
                { case: { $eq: ['$unitType', 'Offices'] }, then: 'Offices' },
                { case: { $eq: ['$unitType', 'Office'] }, then: 'Offices' },
                { case: { $eq: ['$unitType', 'Shop'] }, then: 'Shop' },
              ],
              default: 'Unknown',
            },
          },
          noOfBedRooms: {
            $cond: {
              if: { $isNumber: '$noOfBedRooms' },
              then: '$noOfBedRooms',
              else: null,
            },
          },
        },
      },
      {
        $group: {
          _id: {
            unitType: '$unitType',
            noOfBedRooms: '$noOfBedRooms',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    console.log('Aggregation output:', inventoryStats);

    const inventory = {
      Shop: 0,
      Offices: 0,
      Studios: 0,
      '1 BR': 0,
      '2 BR': 0,
      '3 BR': 0,
      '4 BR': 0,
      '5 BR': 0,
      '6 BR': 0,
      '7 BR': 0,
      '8 BR': 0,
    };

    for (const item of inventoryStats) {
      const { unitType, noOfBedRooms } = item._id;
      const count = item.count;

      if (unitType === 'Shop') {
        inventory.Shop += count;
      } else if (unitType === 'Offices') {
        inventory.Offices += count;
      } else if (unitType === 'Studios') {
        inventory.Studios += count;
      } else if (unitType === 'BR' && noOfBedRooms >= 1 && noOfBedRooms <= 8) {
        inventory[`${noOfBedRooms} BR`] += count;
      }
    }

    return inventory;
  }

  async getCombinedRentAndSellInventorySummary(projectId: string) {
    const unitPurposes = ['Rent', 'Sell'];

    const inventoryStats = await this.inventoryModel.aggregate([
      {
        $match: {
          project: projectId, // FIXED: Match string not ObjectId
          unitPurpose: { $in: unitPurposes },
        },
      },
      {
        $project: {
          unitType: {
            $switch: {
              branches: [
                { case: { $eq: ['$unitType', 'BedRoom'] }, then: 'BR' },
                { case: { $eq: ['$unitType', 'Bedroom'] }, then: 'BR' },
                { case: { $eq: ['$unitType', 'Studio'] }, then: 'Studios' },
                { case: { $eq: ['$unitType', 'Offices'] }, then: 'Offices' },
                { case: { $eq: ['$unitType', 'Office'] }, then: 'Offices' },
                { case: { $eq: ['$unitType', 'Shop'] }, then: 'Shop' },
              ],
              default: 'Unknown',
            },
          },
          noOfBedRooms: {
            $cond: {
              if: { $isNumber: '$noOfBedRooms' },
              then: '$noOfBedRooms',
              else: null,
            },
          },
        },
      },
      {
        $group: {
          _id: {
            unitType: '$unitType',
            noOfBedRooms: '$noOfBedRooms',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const unitLabels = [
      'Shop',
      'Offices',
      'Studios',
      '1 BR',
      '2 BR',
      '3 BR',
      '4 BR',
      '5 BR',
      '6 BR',
      '7 BR',
      '8 BR',
    ];

    const combinedSummary: Record<string, number> = Object.fromEntries(
      unitLabels.map((label) => [label, 0]),
    );

    for (const item of inventoryStats) {
      const { unitType, noOfBedRooms } = item._id;
      const count = item.count;

      if (unitType === 'Shop') {
        combinedSummary['Shop'] += count;
      } else if (unitType === 'Offices') {
        combinedSummary['Offices'] += count;
      } else if (unitType === 'Studios') {
        combinedSummary['Studios'] += count;
      } else if (unitType === 'BR' && noOfBedRooms >= 1 && noOfBedRooms <= 8) {
        combinedSummary[`${noOfBedRooms} BR`] += count;
      }
    }

    return combinedSummary;
  }

  async getPriceStatsIncludingAllPurposes(projectId: string) {
    const stats = await this.inventoryModel.aggregate([
      {
        $match: {
          project: projectId, // FIXED: use string, not ObjectId
        },
      },
      {
        $project: {
          unitType: {
            $switch: {
              branches: [
                { case: { $eq: ['$unitType', 'BedRoom'] }, then: 'BR' },
                { case: { $eq: ['$unitType', 'Bedroom'] }, then: 'BR' },
                { case: { $eq: ['$unitType', 'Studio'] }, then: 'Studios' },
                { case: { $eq: ['$unitType', 'Offices'] }, then: 'Offices' },
                { case: { $eq: ['$unitType', 'Office'] }, then: 'Offices' },
                { case: { $eq: ['$unitType', 'Shop'] }, then: 'Shop' },
              ],
              default: 'Unknown',
            },
          },
          noOfBedRooms: {
            $cond: {
              if: { $isNumber: '$noOfBedRooms' },
              then: '$noOfBedRooms',
              else: null,
            },
          },
          marketPrice: 1,
          askingPrice: 1,
          premiumLoss: { $subtract: ['$askingPrice', '$marketPrice'] },
        },
      },
      {
        $group: {
          _id: {
            unitType: '$unitType',
            noOfBedRooms: '$noOfBedRooms',
          },
          marketPriceMin: { $min: '$marketPrice' },
          marketPriceMax: { $max: '$marketPrice' },
          askingPriceMin: { $min: '$askingPrice' },
          askingPriceMax: { $max: '$askingPrice' },
          premiumMin: { $min: '$premiumLoss' },
          premiumMax: { $max: '$premiumLoss' },
        },
      },
    ]);

    const unitLabels = [
      'Studio',
      '1 BR',
      '2 BR',
      '3 BR',
      '4 BR',
      '5 BR',
      '6 BR',
      '7 BR',
      '8 BR',
    ];

    const result = Object.fromEntries(
      unitLabels.map((label) => [
        label,
        {
          marketPrice: { min: 0, max: 0 },
          askingPrice: { min: 0, max: 0 },
          premium: { min: 0, max: 0 },
        },
      ]),
    );

    for (const item of stats) {
      const { unitType, noOfBedRooms } = item._id;
      let label = '';

      if (unitType === 'Studios' || noOfBedRooms === 0) {
        label = 'Studio';
      } else if (unitType === 'BR' && noOfBedRooms >= 1 && noOfBedRooms <= 8) {
        label = `${noOfBedRooms} BR`;
      }

      if (label && result[label]) {
        result[label] = {
          marketPrice: {
            min: item.marketPriceMin ?? 0,
            max: item.marketPriceMax ?? 0,
          },
          askingPrice: {
            min: item.askingPriceMin ?? 0,
            max: item.askingPriceMax ?? 0,
          },
          premium: {
            min: item.premiumMin ?? 0,
            max: item.premiumMax ?? 0,
          },
        };
      }
    }

    return result;
  }

  async report(id: string): Promise<any> {
    try {
      // console.log((id = '6814dc2df2829e48c3df4ee0'));
      const projectDoc = await this.projectModel
        .findOne({ _id: id }) // Use _id, not __id
        .populate('masterDevelopment') // Populate masterDevelopment
        .populate('subDevelopment') // Populate subDevelopment
        .exec();

      console.log(await this.getInventorySummary(id));

      if (projectDoc?.plot) {
        return {
          success: true,
          masterDevelopment: projectDoc.masterDevelopment.developmentName,
          subDevelopment: 'N/A',
          project: projectDoc.projectName,
          projectQuality: projectDoc.projectQuality,
          constructionStatus: projectDoc.constructionStatus,
          salesStatus: projectDoc.salesStatus,
          plotPermission: projectDoc.plot.plotPermission,
          plotHeight: projectDoc.plot.plotHeight,
          plotSizeSqFt: projectDoc.plot.plotSizeSqFt,
          plotBUASqFt: projectDoc.plot.plotBUASqFt,
          launchDate: projectDoc.launchDate,
          completionDate: projectDoc.completionDate,
          downPayment: projectDoc.downPayment,
          installmentDate: projectDoc.installmentDate,
          uponCompletion: projectDoc.uponCompletion,
          postHandOver: projectDoc.postHandOver,
          facilityCategories: projectDoc.facilityCategories,
          amenitiesCategories: projectDoc.amenitiesCategories,
          inventory: await this.getInventorySummary(id),
          availability: await this.getCombinedRentAndSellInventorySummary(id),
          priceRange: await this.getPriceStatsIncludingAllPurposes(id),
        };
      } else if (
        projectDoc?.plot == null &&
        projectDoc?.subDevelopment == null
      ) {
        return {
          success: true,
          masterDevelopment: projectDoc.masterDevelopment.developmentName,
          subDevelopment: 'N/A',
          project: projectDoc.projectName,
          projectQuality: projectDoc.projectQuality,
          constructionStatus: projectDoc.constructionStatus,
          salesStatus: projectDoc.salesStatus,
          plotPermission: null,
          plotHeight: null,
          plotSizeSqFt: null,
          plotBUASqFt: null,
          launchDate: projectDoc.launchDate,
          completionDate: projectDoc.completionDate,
          downPayment: projectDoc.downPayment,
          installmentDate: projectDoc.installmentDate,
          uponCompletion: projectDoc.uponCompletion,
          postHandOver: projectDoc.postHandOver,
          facilityCategories: projectDoc.facilityCategories,
          amenitiesCategories: projectDoc.amenitiesCategories,
          inventory: await this.getInventorySummary(id),
          availability: await this.getCombinedRentAndSellInventorySummary(id),
          priceRange: await this.getPriceStatsIncludingAllPurposes(id),
        };
      } else if (projectDoc?.subDevelopment) {
        return {
          success: true,
          masterDevelopment: projectDoc.masterDevelopment.developmentName,
          subDevelopment: projectDoc.subDevelopment.subDevelopment,
          project: projectDoc.projectName,
          projectQuality: projectDoc.projectQuality,
          constructionStatus: projectDoc.constructionStatus,
          salesStatus: projectDoc.salesStatus,
          plotPermission: projectDoc.subDevelopment.plotPermission,
          plotHeight: projectDoc.subDevelopment.plotHeight,
          plotSizeSqFt: projectDoc.subDevelopment.plotSizeSqFt,
          plotBUASqFt: projectDoc.subDevelopment.plotBUASqFt,
          launchDate: projectDoc.launchDate,
          completionDate: projectDoc.completionDate,
          downPayment: projectDoc.downPayment,
          installmentDate: projectDoc.installmentDate,
          uponCompletion: projectDoc.uponCompletion,
          postHandOver: projectDoc.postHandOver,
          facilityCategories: projectDoc.facilityCategories,
          amenitiesCategories: projectDoc.amenitiesCategories,
          inventory: await this.getInventorySummary(id),
          availability: await this.getCombinedRentAndSellInventorySummary(id),
          priceRange: await this.getPriceStatsIncludingAllPurposes(id),
        };
      }
    } catch (e: any) {
      console.log(e);
      return {
        success: false,
      };
    }
  }

  async delete(id: string): Promise<void> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.projectModel.findByIdAndDelete({ _id: id }, { session });
      await this.inventoryModel.deleteMany({ project: id }, { session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error('Error deleting MasterDevelopment by ID:', error);
      throw new Error('Failed to delete MasterDevelopment');
    } finally {
      session.endSession();
    }
  }

  async importExcelFile(filePath: string): Promise<any> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON with headers as keys (default header: 0)
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 0 });
      console.log(jsonData);

      // Clean headers (strip out \n and extra spaces)
      const cleanHeaders = Object.keys(jsonData[0]).map(
        (header: string) => header.replace(/\n/g, ' ').trim(), // Remove newlines and trim spaces
      );

      // Check if cleaned headers match the expected headers
      const headersMatch = EXPECTED_HEADERS.every(
        (expected, idx) => expected === cleanHeaders[idx],
      );

      if (!headersMatch) {
        return {
          success: false,
          message: 'Uploaded file headers do not match the required format.',
          expectedHeaders: EXPECTED_HEADERS,
          fileHeaders: cleanHeaders,
        };
      }

      // Initialize a set to track duplicate project names
      const projectNamesSet = new Set<string>();

      // Update rows with valid commission value and valid project quality values
      const updatedRows = jsonData
        .map((row: any) => {
          // Commission value check
          if (typeof row[cleanHeaders['Commission  %']] !== 'number') {
            row[cleanHeaders['Commission  %']] = 0;
          }

          // Date conversion: Convert serial date to formatted date string (yyyy-MM-dd)
          const dateColumns = [
            'Launch  Date',
            'Completion Date',
            'Listing  Date',
          ]; // List your date columns here
          dateColumns.forEach((columnName) => {
            const columnIndex = cleanHeaders.indexOf(columnName);
            if (columnIndex !== -1 && row[cleanHeaders[columnIndex]]) {
              // Convert the serial number to a formatted date string (yyyy-MM-dd)
              const dateValue = row[cleanHeaders[columnName]];
              const formattedDate = XLSX.utils.format_cell({
                t: 'n',
                v: dateValue,
              }); // Use format_cell for conversion

              // Ensure we are formatting correctly
              const dateObject = new Date(formattedDate);
              const dateString = dateObject.toISOString().split('T')[0]; // Get the date in yyyy-MM-dd format
              row[cleanHeaders[columnName]] = dateString;
            }
          });

          // Trim and ensure valid "Project Quality" value (Randomly choose if invalid)
          let projectQuality = (
            row[cleanHeaders['Project  Quality']] || ''
          ).trim();
          const validQualityValues = ['A', 'B', 'C'];
          if (!validQualityValues.includes(projectQuality)) {
            projectQuality =
              validQualityValues[
                Math.floor(Math.random() * validQualityValues.length)
              ];
          }
          row[cleanHeaders['Project  Quality']] = projectQuality;

          // Validate "Construction Status", "Down Payment", "During Construction", "Upon Completion", "Post Handover"
          const columnsToCheck = [
            'Construction Status',
            'Down  Payment',
            'During  Construction',
            'Upon  Completion',
            'Post  Handover',
          ];

          columnsToCheck.forEach((columnName) => {
            const columnIndex = cleanHeaders.indexOf(columnName);
            if (columnIndex !== -1) {
              const columnValue = (row[cleanHeaders[columnIndex]] || '').trim();

              // If the column value is not a number, set it to 0
              if (isNaN(Number(columnValue))) {
                row[cleanHeaders[columnName]] = 0;
              } else {
                row[cleanHeaders[columnName]] = Number(columnValue);
              }
            }
          });

          // Check if 'Sales Status' exists, if not set to 'Pending'
          const salesStatusIndex = cleanHeaders.indexOf('Sales  Status');
          if (salesStatusIndex !== -1) {
            let salesStatus = (
              row[cleanHeaders[salesStatusIndex]] || ''
            ).trim();
            if (!salesStatus) {
              salesStatus = 'Pending';
            }
            row[cleanHeaders[salesStatusIndex]] = salesStatus;
          } else {
            return {
              success: false,
              message: '"Sales Status" column is missing from the file.',
            };
          }

          // Property Type check - Ensure at least one Property Type is provided
          const propertyTypeColumns = [
            'Property  Type 1',
            'Property  Type 2',
            'Property  Type 3',
            'Property  Type 4',
            'Property  Type 5',
          ];

          // Check if at least one property type field is filled
          const propertyTypeValues = propertyTypeColumns.map((columnName) =>
            (row[cleanHeaders.indexOf(columnName)] || '').trim(),
          );
          const validPropertyTypes = propertyTypeValues.filter(
            (value) => value,
          );

          // If no property types are provided, skip this row
          if (validPropertyTypes.length === 0) {
            return null; // This will exclude the row from the final data
          }

          // Create a propertyType array with the valid property types
          row['propertyType'] = validPropertyTypes.slice(0, 1); // Limit to 1 value in the array

          // Project Height: Ensure it's a number, if not, set to 0
          const projectHeightIndex = cleanHeaders.indexOf('Project  Height');
          if (projectHeightIndex !== -1) {
            const heightValue = (
              row[cleanHeaders[projectHeightIndex]] || ''
            ).trim();
            row[cleanHeaders[projectHeightIndex]] = isNaN(Number(heightValue))
              ? 0
              : Number(heightValue);
          }

          // Master Development: Ensure it's provided, if not, skip the row
          const masterDevelopmentIndex = cleanHeaders.indexOf(
            'Master  Development',
          );
          if (
            masterDevelopmentIndex === -1 ||
            !row[cleanHeaders[masterDevelopmentIndex]]?.trim()
          ) {
            return null; // Skip the row if Master Development is missing or empty
          }

          // Project Name: Ensure it's provided, and check for duplicates
          const projectNameIndex = cleanHeaders.indexOf('Project Name');
          if (projectNameIndex !== -1) {
            let projectName = (
              row[cleanHeaders[projectNameIndex]] || ''
            ).trim();

            // If Project Name is empty, skip this row
            if (!projectName) {
              return null; // This will exclude the row from the final data
            }

            // Check for duplicates
            if (projectNamesSet.has(projectName)) {
              return {
                success: false,
                message: `Duplicate projectName found in the file: "${projectName}"`,
              };
            }

            // Add the project name to the set
            projectNamesSet.add(projectName);
          }

          return row; // Return the updated row
        })
        .filter((row) => row !== null); // Filter out rows that are null (Master Development missing or Project Name missing)

      return {
        success: true,
        data: updatedRows, // Return the updated data with valid property types
      };
    } catch (error: any) {
      return {
        success: false,
        message:
          error?.message || 'Unexpected error occurred while reading the file.',
      };
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
