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
import { Connection, Model, Types } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectFilterInput } from './dto/project-filter.input';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { MasterDevelopment } from 'src/masterdevelopment/schema/master-development.schema';
import { SubDevelopment } from 'src/subdevelopment/schema/subdevelopment.schema';

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

const test = [
  {
    'Commission \r\n%': 20,
    'Project \r\nQuality': 'A',
    'Construction\nStatus': 30,
    'Launch \nDate': '2025-14-06',
    'Completion Date': '2025-14-06',
    'Sales \nStatus': 'Pending',
    'Down \nPayment': 20,
    'During \nConstruction': 50,
    'Upon \nCompletion': 80,
    'Post \nHandover ': 20,
    'Listing \nDate': '2025-14-06',
    'Property \nType\n1': 'Shops',
    'Property \r\nType\r\n3': 'Offices',
    'Project \nHeight': 200,
    'Master \nDevelopment': 'Downtown Burj Khalifa',
    'Sub \nDevelopment': '3sfscs',
    'Project Name': 'zain',
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

  toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase(),
      )
      .replace(/\s+/g, '')
      .replace(/-/g, '');
  }
  
  async importExcelFile(filePath: string): Promise<any> {
    try {
      // Read and parse Excel file
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 0 });
      // const jsonData = test;

      // Clean headers
      const cleanHeaders = Object.keys(jsonData[0]).map((header: string) =>
        this.toCamelCase(header.replace(/[\r\n\s]+/g, ' ').trim()),
      );

      console.log('Cleaned Headers: ', cleanHeaders);

      // Extract all unique master and sub developments from the file
      const masterDevSet = new Set<string>();
      const subDevSet = new Set<string>();
      const projectNamesSet = new Set<string>(); // For tracking project names in the file

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
          const subDevName = row[Object.keys(row)[subDevIndex]]
            ?.toString()
            .trim();
          if (subDevName) subDevSet.add(subDevName);
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

      // Check against database for existing projects
      const existingProjects = await this.projectModel
        .find({
          projectName: { $in: projectNamesInFile },
        })
        .select('projectName')
        .lean();

      const existingProjectNames = existingProjects.map(
        (proj) => proj.projectName,
      );
      const duplicateProjectsInFile = projectNamesInFile.filter((name) =>
        existingProjectNames.includes(name),
      );

      if (duplicateProjectsInFile.length > 0) {
        console.log(
          'Duplicate projects found in database:',
          duplicateProjectsInFile,
        );
      }

      // Check against database and get IDs and details for developments
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
          _id: dev._id as Types.ObjectId,
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

      // Log invalid developments
      if (invalidMasterDevs.length > 0) {
        console.log('Invalid master developments:', invalidMasterDevs);
      }
      if (invalidSubDevs.length > 0) {
        console.log('Invalid sub developments:', invalidSubDevs);
      }

      // Process rows
      const processedProjectNames = new Set<string>();
      const validRows = [];

      for (const rawRow of jsonData) {
        try {
          // Create clean row object
          const cleanRow: any = {};
          cleanHeaders.forEach((cleanHeader, index) => {
            const originalHeader = Object.keys(rawRow)[index];
            const value = rawRow[originalHeader];
            cleanRow[cleanHeader] =
              value !== null && value !== undefined
                ? value.toString().trim()
                : '';
          });

          // Skip if project name is duplicate in database
          if (existingProjectNames.includes(cleanRow.projectName)) {
            console.log(
              `Skipping row - Project already exists in database: ${cleanRow.projectName}`,
            );
            continue;
          }

          // Get master development name
          const masterDevName = cleanRow.masterDevelopment;

          // Skip if master development is invalid
          if (!masterDevIdMap.has(masterDevName)) {
            console.log(
              `Skipping row - Invalid master development: ${masterDevName}`,
            );
            continue;
          }

          // Replace name with ID
          cleanRow.masterDevelopment = masterDevIdMap.get(masterDevName);

          // Process sub development
          const subDevName = cleanRow.subDevelopment;
          if (subDevName) {
            if (subDevDetailsMap.has(subDevName)) {
              const subDevDetails = subDevDetailsMap.get(subDevName);
              // Add sub development ID
              cleanRow.subDevelopment = subDevDetails._id;

              // Add plot details
              cleanRow.plot = {
                plotNumber: subDevDetails.plotNumber,
                plotHeight: subDevDetails.plotHeight,
                plotPermission: subDevDetails.plotPermission,
                plotSizeSqFt: subDevDetails.plotSizeSqFt,
                plotBUASqFt: subDevDetails.plotBUASqFt,
                plotStatus: subDevDetails.plotStatus,
                buaAreaSqFt: subDevDetails.buaAreaSqFt,
              };
            } else {
              // Sub development not found - use default values
              cleanRow.subDevelopment = null;
              cleanRow.plot = {
                plotNumber: '',
                plotHeight: 0,
                plotPermission: ['Pending'],
                plotSizeSqFt: 0,
                plotBUASqFt: 0,
                plotStatus: '',
                buaAreaSqFt: 0,
              };
            }
          } else {
            // No sub development provided - use default values
            cleanRow.subDevelopment = null;
            cleanRow.plot = {
              plotNumber: '',
              plotHeight: 0,
              plotPermission: ['Pending'],
              plotSizeSqFt: 0,
              plotBUASqFt: 0,
              plotStatus: '',
              buaAreaSqFt: 0,
            };
          }

          // Commission value
          if (cleanRow.commission && isNaN(Number(cleanRow.commission))) {
            cleanRow.commission = 0;
          }

          // Date conversion
          const dateColumns = ['launchDate', 'completionDate', 'listingDate'];
          for (const column of dateColumns) {
            if (cleanRow[column]) {
              const dateParts = cleanRow[column].split('-');
              if (dateParts.length === 3) {
                const [year, day, month] = dateParts;
                const dateStr = `${year}-${month}-${day}`;
                const dateObj = new Date(dateStr);

                if (!isNaN(dateObj.getTime())) {
                  cleanRow[column] = dateObj.toISOString().split('T')[0];
                } else {
                  cleanRow[column] = null;
                }
              }
            }
          }

          // Project Quality
          const validQualityValues = ['A', 'B', 'C'];
          if (!validQualityValues.includes(cleanRow.projectQuality)) {
            cleanRow.projectQuality =
              validQualityValues[
                Math.floor(Math.random() * validQualityValues.length)
              ];
          }

          // Numeric fields
          const numericColumns = [
            'constructionStatus',
            'downPayment',
            'duringConstruction',
            'uponCompletion',
            'postHandover',
            'projectHeight',
          ];
          for (const column of numericColumns) {
            if (cleanRow[column]) {
              cleanRow[column] = isNaN(Number(cleanRow[column]))
                ? 0
                : Number(cleanRow[column]);
            }
          }

          // Sales Status
          if (!cleanRow.salesStatus) {
            cleanRow.salesStatus = 'Pending';
          }

          // Property Types
          const propertyTypeColumns = cleanHeaders.filter((header) =>
            header.startsWith('propertyType'),
          );
          const propertyTypeValues = propertyTypeColumns
            .map((col) => cleanRow[col]?.toString().trim() || '')
            .filter(Boolean);

          if (propertyTypeValues.length === 0) {
            console.log('Skipping row - No property types provided');
            continue;
          }

          cleanRow.propertyType = propertyTypeValues;
          propertyTypeColumns.forEach((col) => delete cleanRow[col]);

          // Validate required fields
          if (!cleanRow.projectName) {
            console.log('Skipping row - Missing project name');
            continue;
          }

          // Check for duplicate project names within the file
          if (processedProjectNames.has(cleanRow.projectName)) {
            console.log(
              `Duplicate project name in file: ${cleanRow.projectName}`,
            );
            return {
              success: false,
              message: `Duplicate project name found in file: ${cleanRow.projectName}`,
            };
          }
          processedProjectNames.add(cleanRow.projectName);

          validRows.push(cleanRow);
        } catch (rowError) {
          console.error('Error processing row:', rowError);
        }
      }

      return {
        success: true,
        data: validRows,
        invalidMasterDevelopments: invalidMasterDevs,
        invalidSubDevelopments: invalidSubDevs,
        duplicateProjects: duplicateProjectsInFile,
        message:
          invalidMasterDevs.length > 0 ||
          invalidSubDevs.length > 0 ||
          duplicateProjectsInFile.length > 0
            ? `Some issues found: 
             Missing master developments: ${invalidMasterDevs.join(', ')}
             Missing sub developments: ${invalidSubDevs.join(', ')}
             Duplicate projects: ${duplicateProjectsInFile.join(', ')}`
            : 'All data validated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Error processing Excel file',
      };
    } finally {
      // Clean up file
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
