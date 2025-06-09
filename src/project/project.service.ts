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
import { Connection, Model } from 'mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectFilterInput } from './dto/project-filter.input';

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
        if (filter.plotPermission) {
          query['plot.plotPermission'] = { $in: filter.plotPermission };
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
          query.height = filter.commission;
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

        if (filter.installmentDate) {
          query.installmentDate = filter.installmentDate;
        }

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
}
