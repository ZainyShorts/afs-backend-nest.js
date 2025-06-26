import {
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
import { Connection, Model, Types } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectFilterInput } from './dto/project-filter.input';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { MasterDevelopment } from 'src/masterdevelopment/schema/master-development.schema';
import { SubDevelopment } from 'src/subdevelopment/schema/subdevelopment.schema';

const test = [
  {
    Commission: 20,
    'Project \r\nQuality': 'A',
    'Construction\nStatus': 30,
    'Launch \nDate': '2025-14-06',
    'Completion Date': '2025-14-06',
    'Sales \nStatus': 'Pending',
    'Down \nPayment': 20,
    'During \nConstruction': 50,
    'Upon \nCompletion': '2025-14-06',
    'Post \nHandover ': '2022-17-06',
    'Listing \nDate': '2025-14-06',
    'Property \nType\n1': 'Shops',
    'Property \r\nType\r\n3': 'Offices',
    'Project \nHeight': 200,
    'Master \nDevelopment': 'Downtown Burj Khalifa',
    'Sub \nDevelopment': '3sfscs',
    'Project Name': 'zain',
  },
  {
    'Commission \r\n%': 20,
    'Project \r\nQuality': 'A',
    'Construction\nStatus': 30,
    'Launch \nDate': '2025-14-06',
    'Completion Date': '2025-14-06',
    'Sales \nStatus': 'Pending',
    'Down \nPayment': 20,
    'During \nConstruction': 50,
    'Upon \nCompletion': '2023-14-06',
    'Post \nHandover ': '2026-14-06',
    'Listing \nDate': '2025-14-06',
    'Property \nType\n1': 'Shops',
    'Property \r\nType\r\n3': 'Offices',
    'Project \nHeight': 200,
    'Master \nDevelopment': 'Downtown Burj Khalifa',
    'Sub \nDevelopment': 'sub Development 2',
    'Project Name': 'test',
  },
];

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(MasterDevelopment.name)
    private masterDevelopment: Model<MasterDevelopment>,
    @InjectModel(SubDevelopment.name)
    private subDevelopment: Model<SubDevelopment>,
    @InjectModel(Inventory.name)
    private inventoryModel: Model<InventoryDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<Project> {
    try {
      // Check if project with the same name already exists
      const existingProject = await this.projectModel.findOne({
        projectName: createProjectDto.projectName,
      });
      if (existingProject) {
        throw new ConflictException('Project name already exists');
      }

      // Create new project
      const createdProject = new this.projectModel({
        ...createProjectDto,
        user: userId,
      });
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
          // Guarantee we're working with an array
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
      // Support both string and ObjectId for masterDevelopment and subDevelopment fields
      const projectId = Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id;
      // Find the project (to get masterDevelopment and subDevelopment references)
      const project = await this.projectModel.findOne({
        $or: [
          { _id: id },
          { _id: projectId },
        ],
      }, null, { session });
      if (!project) {
        throw new NotFoundException(`Project with id ${id} not found`);
      }
      // Delete all inventories for this project
      await this.inventoryModel.deleteMany({ project: { $in: [id, projectId] } }, { session });
      // Delete the project itself
      await this.projectModel.deleteOne({
        $or: [
          { _id: id },
          { _id: projectId },
        ],
      }, { session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error('Error deleting Project by ID:', error);
      throw new Error('Failed to delete Project and related inventories');
    } finally {
      session.endSession();
    }
  }

  toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase(),
      )
      .replace(/\s+/g, '')
      .replace(/-/g, '');
  }

  async importExcelFile(filePath: string, userId: string): Promise<any> {
    try {
      console.log('Starting file import process...', userId);

      // Helper function to parse and return the correct number type (int or float)
      const parseNumber = (value: string): number => {
        if (value === null || value === undefined || value.trim() === '') {
          return 0; // Default to 0 if the value is invalid or empty
        }

        const parsedValue = parseFloat(value.trim());

        // If parsed value is a valid number
        if (!isNaN(parsedValue)) {
          return parsedValue % 1 === 0 ? Math.floor(parsedValue) : parsedValue; // Return as integer if whole number, else as float
        }

        return 0; // Default to 0 if the value is not a valid number
      };

      // 1. Read and parse Excel file
      console.log('Reading Excel file...');
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 0 });
      console.log(`Found ${jsonData.length} rows in Excel file`);

      if (jsonData.length === 0) {
        return {
          success: false,
          message: 'Excel file is empty',
        };
      }

      // 2. Clean headers
      const cleanHeaders = Object.keys(jsonData[0]).map((header: string) =>
        this.toCamelCase(header.replace(/[\r\n\s]+/g, ' ').trim()),
      );
      console.log('Cleaned Headers:', cleanHeaders);

      // 3. Extract unique references
      const masterDevSet = new Set<string>();
      const subDevSet = new Set<string>();
      const projectNamesSet = new Set<string>();

      jsonData.forEach((row: any) => {
        const masterDevIndex = cleanHeaders.indexOf('masterDevelopment');
        const subDevIndex = cleanHeaders.indexOf('subDevelopment');
        const projectNameIndex = cleanHeaders.indexOf('projectName');

        if (masterDevIndex !== -1) {
          const devName = row[Object.keys(row)[masterDevIndex]]
            ?.toString()
            .trim();
          if (devName) masterDevSet.add(devName);
        }

        if (subDevIndex !== -1) {
          const originalKey = Object.keys(row)[subDevIndex];
          if (originalKey && row[originalKey]) {
            const subDevName = row[originalKey]?.toString().trim();
            if (subDevName) subDevSet.add(subDevName);
          }
        }

        if (projectNameIndex !== -1) {
          const projectName = row[Object.keys(row)[projectNameIndex]]
            ?.toString()
            .trim();
          if (projectName) projectNamesSet.add(projectName);
        }
      });

      const masterDevelopmentsInFile = Array.from(masterDevSet);
      const subDevelopmentsInFile = Array.from(subDevSet);
      const projectNamesInFile = Array.from(projectNamesSet);

      console.log(
        `Found ${masterDevelopmentsInFile.length} master developments, ${subDevelopmentsInFile.length} sub developments, ${projectNamesInFile.length} projects`,
      );

      // 4. Check for existing projects
      console.log('Checking for existing projects...');
      const existingProjects = await this.projectModel
        .find({ projectName: { $in: projectNamesInFile } })
        .select('projectName')
        .lean();

      const existingProjectNames = existingProjects.map(
        (proj) => proj.projectName,
      );
      const duplicateProjectsInFile = projectNamesInFile.filter((name) =>
        existingProjectNames.includes(name),
      );

      if (duplicateProjectsInFile.length > 0) {
        console.log('Duplicate projects found:', duplicateProjectsInFile);
      }

      // 5. Get development references
      console.log('Fetching development references...');
      const [existingMasterDevs, existingSubDevs] = await Promise.all([
        this.masterDevelopment
          .find({
            developmentName: { $in: masterDevelopmentsInFile },
          })
          .select('developmentName _id')
          .lean(),
        this.subDevelopment
          .find({
            subDevelopment: { $in: subDevelopmentsInFile },
          })
          .select(
            'subDevelopment plotNumber plotHeight plotPermission plotSizeSqFt plotBUASqFt plotStatus buaAreaSqFt _id',
          )
          .lean(),
      ]);

      // Create mappings
      const masterDevIdMap = new Map<string, Types.ObjectId>();
      const subDevDetailsMap = new Map<string, any>();

      existingMasterDevs.forEach((dev) => {
        masterDevIdMap.set(dev.developmentName, dev._id as Types.ObjectId);
      });

      existingSubDevs.forEach((dev) => {
        subDevDetailsMap.set(dev.subDevelopment, {
          _id: dev._id,
          plotNumber: dev.plotNumber || '',
          plotHeight: dev.plotHeight || 0,
          plotPermission: dev.plotPermission || ['Pending'],
          plotSizeSqFt: dev.plotSizeSqFt || 0,
          plotBUASqFt: dev.plotBUASqFt || 0,
          plotStatus: dev.plotStatus || '',
          buaAreaSqFt: dev.buaAreaSqFt || 0,
        });
      });

      const invalidMasterDevs = masterDevelopmentsInFile.filter(
        (dev) => !masterDevIdMap.has(dev),
      );
      const invalidSubDevs = subDevelopmentsInFile.filter(
        (dev) => !subDevDetailsMap.has(dev),
      );

      // 6. Process rows
      console.log('Processing rows...');
      const processedProjectNames = new Set<string>();
      const validRows = [];
      const skippedRows = [];
      const batchSize = 5000;
      let insertedCount = 0;
      let skippedCount = 0;

      for (const [index, rawRow] of jsonData.entries()) {
        try {
          // Create clean row object
          const cleanRow: any = {};
          cleanHeaders.forEach((cleanHeader, idx) => {
            const originalKey = Object.keys(rawRow)[idx];
            cleanRow[cleanHeader] =
              rawRow[originalKey] !== null && rawRow[originalKey] !== undefined
                ? rawRow[originalKey].toString().trim()
                : '';
          });

          // Validate required fields
          if (!cleanRow.projectName) {
            skippedRows.push({
              row: index + 1,
              reason: 'Missing project name',
            });
            skippedCount++;
            continue;
          }

          if (existingProjectNames.includes(cleanRow.projectName)) {
            skippedRows.push({
              row: index + 1,
              projectName: cleanRow.projectName,
              reason: 'Project already exists',
            });
            skippedCount++;
            continue;
          }

          if (!cleanRow.salesStatus || cleanRow.salesStatus.trim() === '') {
            skippedRows.push({
              row: index + 1,
              projectName: cleanRow.projectName,
              reason: 'Missing sales status',
            });
            skippedCount++;
            continue;
          }

          const validQualityValues = ['A', 'B', 'C'];
          if (!validQualityValues.includes(cleanRow.projectQuality?.trim())) {
            skippedRows.push({
              row: index + 1,
              projectName: cleanRow.projectName,
              reason: 'Invalid project quality',
            });
            skippedCount++;
            continue;
          }

          // Process master development
          const masterDevName = cleanRow.masterDevelopment;
          if (!masterDevIdMap.has(masterDevName)) {
            skippedRows.push({
              row: index + 1,
              projectName: cleanRow.projectName,
              reason: `Invalid master development: ${masterDevName}`,
            });
            skippedCount++;
            continue;
          }
          cleanRow.masterDevelopment = masterDevIdMap.get(masterDevName);

          // Process sub development (optional)
          const subDevName = cleanRow.subDevelopment;
          if (subDevName && subDevName.trim() !== '') {
            if (!subDevDetailsMap.has(subDevName)) {
              skippedRows.push({
                row: index + 1,
                projectName: cleanRow.projectName,
                reason: `Invalid sub development: ${subDevName}`,
              });
              skippedCount++;
              continue;
            }
            const subDevDetails = subDevDetailsMap.get(subDevName);
            cleanRow.subDevelopment = subDevDetails._id;
            cleanRow.plot = {
              plotNumber: subDevDetails.plotNumber,
              plotHeight: subDevDetails.plotHeight,
              plotPermission: subDevDetails.plotPermission
                ? subDevDetails.plotPermission
                : [],
              plotSizeSqFt: subDevDetails.plotSizeSqFt,
              plotBUASqFt: subDevDetails.plotBUASqFt,
              plotStatus: subDevDetails.plotStatus,
              buaAreaSqFt: subDevDetails.buaAreaSqFt,
            };
          } else {
            delete cleanRow.subDevelopment;
          }

          // Process commission and numeric fields
          cleanRow.commission = parseNumber(cleanRow.commission);
          cleanRow.constructionStatus = parseNumber(
            cleanRow.constructionStatus,
          );
          cleanRow.percentOfConstruction = parseNumber(
            cleanRow.percentOfConstruction,
          );
          cleanRow.downPayment = parseNumber(cleanRow.downPayment);
          cleanRow.duringConstruction = parseNumber(
            cleanRow.duringConstruction,
          );
          cleanRow.projectHeight = parseNumber(cleanRow.projectHeight);

          // Process date fields - FIXED VERSION
          const parseDate = (dateString: string): string | null => {
            if (!dateString || dateString.trim() === '') return null;

            // Handle format: YYYY-DD-MM (your current format)
            const dateParts = dateString.split('-');
            if (dateParts.length === 3) {
              const [year, day, month] = dateParts;
              const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              const dateObj = new Date(dateStr);

              if (!isNaN(dateObj.getTime())) {
                return dateObj.toISOString().split('T')[0];
              }
            }

            // Try parsing as-is if the above fails
            const directDate = new Date(dateString);
            if (!isNaN(directDate.getTime())) {
              return directDate.toISOString().split('T')[0];
            }

            return null;
          };

          // Process date fields - FIXED VERSION
          if (cleanRow.launchDate) {
            cleanRow.launchDate = parseDate(cleanRow.launchDate);
          }

          if (cleanRow.completionDate) {
            cleanRow.completionDate = parseDate(cleanRow.completionDate);
          }

          // CRITICAL FIX: Process Upon Completion and Post Handover dates
          if (cleanRow.uponCompletion) {
            const parsedDate = parseDate(cleanRow.uponCompletion);
            cleanRow.uponCompletion = parsedDate || cleanRow.uponCompletion;
          }

          if (cleanRow.postHandover) {
            const parsedDate = parseDate(cleanRow.postHandover);
            cleanRow.postHandOver = parsedDate || cleanRow.postHandover; // Note: postHandOver (capital O)
          }

          // Process property types
          const propertyTypeColumns = cleanHeaders.filter((header) =>
            header.startsWith('propertyType'),
          );
          cleanRow.propertyType = propertyTypeColumns
            .map((col) => cleanRow[col]?.toString().trim())
            .filter(Boolean);
          propertyTypeColumns.forEach((col) => delete cleanRow[col]);

          // ====== SCHEMA MAPPING FIXES ======
          cleanRow.height = cleanRow.projectHeight?.toString() || '';
          cleanRow.duringConstruction = cleanRow.duringConstruction || 0;

          cleanRow.facilityCategories = [];
          cleanRow.amenitiesCategories = [];
          cleanRow.pictures = [];
          cleanRow.percentOfConstruction = cleanRow.percentOfConstruction || 0;
          cleanRow.user = userId;

          cleanRow.propertyType = cleanRow.propertyType[0] || 'Other';

          // Check for duplicates in file
          if (processedProjectNames.has(cleanRow.projectName)) {
            skippedRows.push({
              row: index + 1,
              projectName: cleanRow.projectName,
              reason: 'Duplicate project name in file',
            });
            skippedCount++;
            continue;
          }
          processedProjectNames.add(cleanRow.projectName);

          validRows.push(cleanRow);
        } catch (rowError) {
          console.error(`Error processing row ${index + 1}:`, rowError);
          skippedRows.push({
            row: index + 1,
            reason: 'Processing error',
          });
          skippedCount++;
        }
      }

      console.log(
        `Processing complete - Valid rows: ${validRows.length}, Skipped: ${skippedCount}`,
      );

      // 7. Batch insert
      if (validRows.length > 0) {
        console.log('Starting batch inserts...');
        const totalBatches = Math.ceil(validRows.length / batchSize);

        for (let i = 0; i < totalBatches; i++) {
          const batchStart = i * batchSize;
          const batch = validRows.slice(batchStart, batchStart + batchSize);

          try {
            console.log(
              `Inserting batch ${i + 1}/${totalBatches} (${batch.length} records)`,
            );

            const result = await this.projectModel.insertMany(batch, {
              ordered: false,
            });

            insertedCount += result.length;
            console.log(`Successfully inserted ${result.length} records`);
          } catch (batchError) {
            console.error(`Batch ${i + 1} insert error:`, batchError);

            if (batchError.writeErrors) {
              batchError.writeErrors.forEach((error) => {
                skippedCount++;
                const projectName = error.err.op?.projectName || 'Unknown';
                skippedRows.push({
                  projectName,
                  reason: error.err.errmsg || 'Batch insert error',
                });
              });
            }

            if (batchError.message.includes('duplicate key')) {
              console.error('Duplicate key error during batch insert');
            }
          }
        }
      }

      // 8. Prepare response
      const response = {
        success: true,
        insertedCount,
        skippedCount,
        skippedEntries: skippedRows,
        invalidMasterDevelopments: invalidMasterDevs,
        invalidSubDevelopments: invalidSubDevs,
        duplicateProjects: duplicateProjectsInFile,
        message:
          `Import completed. Inserted: ${insertedCount}, Skipped: ${skippedCount}` +
          (invalidMasterDevs.length > 0
            ? `\nInvalid master developments: ${invalidMasterDevs.join(', ')}`
            : '') +
          (invalidSubDevs.length > 0
            ? `\nInvalid sub developments: ${invalidSubDevs.join(', ')}`
            : '') +
          (duplicateProjectsInFile.length > 0
            ? `\nDuplicate projects: ${duplicateProjectsInFile.join(', ')}`
            : ''),
      };

      console.log('Import process completed:', response);
      return response;
    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        message: 'Import failed due to an error. Please try again.',
      };
    } finally {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
  }
}
