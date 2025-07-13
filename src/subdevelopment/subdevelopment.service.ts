import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubDevelopment } from './schema/subdevelopment.schema';
import { CreateSubDevelopmentDto } from './dto/create-sub-development.dto';
import { SubDevelopmentFilterInput } from './dto/sub-development-filter.input';
import { UpdateSubDevelopmentDto } from './dto/update-sub-development.dto';
import {
  AmenitiesCategory,
  FacilitiesCategory,
  PlotStatus,
  PropertyType,
} from 'utils/enum/enums';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { SubDevelopmentheaderMapping } from 'utils/methods/methods';
import { MasterDevelopmentService } from 'src/masterdevelopment/masterdevelopment.service';
import { SubDevelopmentRow } from './interface/sub-dev-interface';
import { InjectConnection } from '@nestjs/mongoose'; 
import { Customer } from 'src/customer/schema/customer.schema';
import { Connection } from 'mongoose';
import { Inventory } from 'src/inventory/schema/inventory.schema';
import { Project } from 'src/project/schema/project.schema';

@Injectable()
export class SubDevelopmentService {
  constructor(
    @InjectModel(SubDevelopment.name)
    private readonly subDevelopmentModel: Model<SubDevelopment>,
    private readonly masterDevelopmentService: MasterDevelopmentService,
    @InjectConnection() private readonly connection: Connection, 
     @InjectModel(Customer.name) private customerModel: Model<Customer>, 
    @InjectModel(Project.name) private readonly ProjectModel: Model<Project>,
    @InjectModel(Inventory.name) 
    private readonly InventoryModel: Model<Inventory>,
  ) {}

  async create(
    dto: CreateSubDevelopmentDto,
    userId: string,
  ): Promise<SubDevelopment> {
    try {
      // Optional validation (can be enum based if needed)
      if (dto.facilitiesCategories) {
        for (const facility of dto.facilitiesCategories) {
          if (typeof facility !== 'string') {
            throw new BadRequestException(
              `Invalid facility category: ${facility}`,
            );
          }
        }
      }

      if (dto.amentiesCategories) {
        for (const amenity of dto.amentiesCategories) {
          if (typeof amenity !== 'string') {
            throw new BadRequestException(
              `Invalid amenity category: ${amenity}`,
            );
          }
        }
      }

      const created = new this.subDevelopmentModel({ ...dto, user: userId });
      return await created.save();
    } catch (error) {
      console.log(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error.response.statusCode === 400) {
        throw new BadRequestException(error.response.message);
      }
      throw new BadRequestException(
        'Failed to create sub development. Check your input.',
      );
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    filter?: SubDevelopmentFilterInput,
    populate?: string,
    fields?: string,
  ): Promise<any> {
    try {
      const query: any = {};

      if (filter) {
        if (filter.subDevelopment) {
          query.subDevelopment = {
            $regex: new RegExp(filter.subDevelopment, 'i'),
          };
        }

        if (filter.plotNumber) {
          query.plotNumber = filter.plotNumber;
        }

        console.log(query);

        if (filter.plotStatus) {
          query.plotStatus = filter.plotStatus;
        }

        if (filter.buaAreaSqFtRange) {
          query.buaAreaSqFt = {};
          if (filter.buaAreaSqFtRange.min !== undefined)
            query.buaAreaSqFt.$gte = filter.buaAreaSqFtRange.min;
          if (filter.buaAreaSqFtRange.max !== undefined)
            query.buaAreaSqFt.$lte = filter.buaAreaSqFtRange.max;
        }

        if (filter.totalSizeSqFtRange) {
          query.totalSizeSqFt = {};
          if (filter.totalSizeSqFtRange.min !== undefined)
            query.totalSizeSqFt.$gte = filter.totalSizeSqFtRange.min;
          if (filter.totalSizeSqFtRange.max !== undefined)
            query.totalSizeSqFt.$lte = filter.totalSizeSqFtRange.max;
        }

        if (filter.plotPermission?.length > 0) {
          query.plotPermission = { $in: filter.plotPermission };
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
          ? await this.subDevelopmentModel.countDocuments(query)
          : await this.subDevelopmentModel.estimatedDocumentCount();

      const projection = fields ? fields.split(',').join(' ') : '';
      const data = await this.subDevelopmentModel
        .find(query)
        .select(projection)
        .populate(populate) // If you want to populate
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
      console.error('Error fetching SubDevelopments:', error);
      throw new InternalServerErrorException(
        error?.message || 'An error occurred while fetching SubDevelopments.',
      );
    }
  } 

    async findOneWithCustomers(id: string): Promise<{
    inventory: SubDevelopment;
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
      const inventory = await this.subDevelopmentModel.findById(id).exec();
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

  async findOne(id: string, populate?: string) {
    try {
      const result = await this.subDevelopmentModel
        .findById(id)
        .populate(populate)
        .exec();
      if (!result) {
        throw new NotFoundException('SubDevelopment not found');
      }
      return result;
    } catch (error) {
      throw new Error(`Failed to fetch SubDevelopment: ${error.message}`);
    }
  }

  async update(id: string, dto: UpdateSubDevelopmentDto) {
    try {
      const dev = await this.subDevelopmentModel.findById(id);
      if (dto.subDevelopment && dto.subDevelopment != dev.subDevelopment) {
        const exists = await this.subDevelopmentModel.findOne({
          subDevelopment: dto.subDevelopment,
        });
        if (exists) {
          throw new BadRequestException(
            'A record with the same Sub-Development Name already exists.',
          );
        }
      }
      if (
        dto.plotStatus &&
        !Object.values(PlotStatus).includes(dto.plotStatus as PlotStatus)
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

      const updated = await this.subDevelopmentModel
        .findByIdAndUpdate(id, dto, { new: true })
        .exec();
      if (!updated) {
        throw new NotFoundException('SubDevelopment not found');
      }
      return updated;
    } catch (error) {
      if (error.response.statusCode == 400)
        throw new BadRequestException(
          `A record with the same Sub-Development Name already exists.`,
        );
      throw new InternalServerErrorException(`${error.message}`);
    }
  } 

    async removeCustomer(subDevelopmentId: string, customerId: string): Promise<SubDevelopment> {
    try {
      const development = await this.subDevelopmentModel.findById(subDevelopmentId).exec();
  
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
          (assignment) => !(assignment.id === subDevelopmentId && assignment.name === 'subDevelopment'),
        );
  
        await customer.save();
      }
  
      return development;
    } catch (error) {
      console.error('Error removing customer from MasterDevelopment:', error);
      throw new Error('Failed to remove customer from MasterDevelopment');
    }
  }
  async addCustomer(subDevelopmentId: string, customerId: string): Promise<SubDevelopment> {
    try {
      const development = await this.subDevelopmentModel.findById(subDevelopmentId).exec();
  
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
        (entry) => entry.id === subDevelopmentId && entry.name === 'subDevelopment'
      );
  
      if (!alreadyAssigned) {
        const newAssignment = {
          id: subDevelopmentId,
          name: 'subDevelopment',
          propertyName: development.subDevelopment,
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
  


  async remove(id: string): Promise<any> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // Support both string and ObjectId for subDevelopment field
      const subDevId = Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id;
      // Find all projects where subDevelopment matches as string or ObjectId
      const projects = await this.ProjectModel.find({
        $or: [
          { subDevelopment: id },
          { subDevelopment: subDevId },
        ],
      }, null, { session });
      const projectIds = projects.map((p) => p._id.toString());

      // Delete all inventories for these projects
      await this.InventoryModel.deleteMany({ project: { $in: projectIds } }, { session });

      // Delete all projects for this subDevelopment
      await this.ProjectModel.deleteMany({
        $or: [
          { subDevelopment: id },
          { subDevelopment: subDevId },
        ],
      }, { session });

      // Delete the subDevelopment itself
      const result = await this.subDevelopmentModel.findByIdAndDelete(id, { session });
      if (!result) {
        throw new NotFoundException(`SubDevelopment with id ${id} not found`);
      }

      await session.commitTransaction();
      return {
        success: true,
        message: `SubDevelopment with id ${id} and its related projects and inventories have been deleted.`,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('Error deleting SubDevelopment:', error);
      throw new InternalServerErrorException(
        error?.message || 'An error occurred while deleting SubDevelopment and related data.'
      );
    } finally {
      session.endSession();
    }
  }

  async import(filePath: string, userId: string): Promise<any> {
    try {
      /* --------------------------------------------------------------------- */
      /* 1️⃣  Read & parse Excel                                               */
      /* --------------------------------------------------------------------- */
      const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      let jsonData = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
        blankrows: false,
      });

      const expectedHeaders = [
        'Development Name',
        'Sub Development',
        'Plot Number',
        'Plot Height',
        'Plot Permission 1',
        'Plot Permission 2',
        'Plot Permission 3',
        'Plot Permission 4',
        'Plot Permission 5',
        'Plot Size Sq. Ft.',
        'Plot BUA Sq. Ft.',
        'Plot Status',
        'BUA Area Sq. Ft.',
        'Facilities Area Sq. Ft.',
        'Amenities Area Sq. Ft.'
      ];

      // Normalize function for headers
      function normalizeHeader(header: string): string {
        return header.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
      }

      // Get actual headers from the first row of the file, normalized
      const actualHeadersRaw = Object.keys(jsonData[0] || {});
      const actualHeaders = actualHeadersRaw.map(normalizeHeader);

      // console.log('EXPECTED HEADERS:', expectedHeaders);
      // console.log('ACTUAL HEADERS IN FILE:', actualHeaders);

      // Warn if any expected header is missing
      const missingHeaders = expectedHeaders.filter(
        (h) => !actualHeaders.includes(normalizeHeader(h))
      );
      if (missingHeaders.length > 0) {
        console.warn('WARNING: The following expected headers are missing after normalization:', missingHeaders);
      }

      /* --------------------------------------------------------------------- */
      /* 2️⃣  Transform + validate each row (skip invalid rows)               */
      /* --------------------------------------------------------------------- */
      type NumericKeys = {
        [K in keyof SubDevelopmentRow]: SubDevelopmentRow[K] extends number
          ? K
          : never;
      }[keyof SubDevelopmentRow];

      const numericFields: NumericKeys[] = [
        'plotHeight',
        'plotSizeSqFt',
        'plotBUASqFt',
        'buaAreaSqFt',
        'facilitiesAreaSqFt',
        'amentiesAreaSqFt',
        'totalAreaSqFt',
      ];

      type SinglePermissionKeys = {
        [K in keyof SubDevelopmentRow]: SubDevelopmentRow[K] extends
          | PropertyType
          | undefined
          ? K
          : never;
      }[keyof SubDevelopmentRow];

      const permissionKeys: SinglePermissionKeys[] = [
        'plotPermission1',
        'plotPermission2',
        'plotPermission3',
        'plotPermission4',
        'plotPermission5',
      ];

      type StringKeys = {
        [K in keyof SubDevelopmentRow]: SubDevelopmentRow[K] extends
          | string
          | undefined
          ? K
          : never;
      }[keyof SubDevelopmentRow];

      const stringKeys: StringKeys[] = [
        'developmentName',
        'subDevelopment',
        'plotNumber',
      ];

      const formattedData: SubDevelopmentRow[] = [];
      const skippedRows: { row: number; reason: string }[] = [];

      // console.log('Starting validation of', jsonData.length, 'rows...');

      for (let r = 0; r < jsonData.length; r++) {
        const raw = jsonData[r] as Record<string, any>;
        const row: Partial<SubDevelopmentRow> = { plotPermission: [] };
        let rowIsValid = true;

        // console.log(`Processing row ${r + 1}:`, raw);

        for (const rawKey in raw) {
          const cleaned = normalizeHeader(rawKey);
          const mappedKey = SubDevelopmentheaderMapping[cleaned] as
            | keyof SubDevelopmentRow
            | undefined;
          const value = raw[rawKey];

          if (!mappedKey) continue; // ignore unknown columns

          /* enum validation -------------------------------------------------- */
          if (mappedKey === 'plotStatus') {
            // Normalize the value for comparison
            const normalizedValue = typeof value === 'string'
              ? value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
              : value;

            // Find a matching enum value (case and space insensitive)
            const matchedEnum = Object.values(PlotStatus).find(
              (enumVal) =>
                enumVal.replace(/\s+/g, ' ').trim().toLowerCase() ===
                normalizedValue.toLowerCase()
            );

            if (!matchedEnum) {
              // console.log(`Row ${r + 1}: Invalid PlotStatus "${value}" (normalized: "${normalizedValue}")`);
              skippedRows.push({
                row: r + 1,
                reason: `Invalid PlotStatus "${value}"`,
              });
              rowIsValid = false;
              break;
            }
            row.plotStatus = matchedEnum;
            continue;
          }

          /* numeric validation ---------------------------------------------- */
          if (numericFields.includes(mappedKey as NumericKeys)) {
            if (value === '' || isNaN(Number(value))) {
              // console.log(`Row ${r + 1}: Field "${cleaned}" must be a number, got "${value}"`);
              skippedRows.push({
                row: r + 1,
                reason: `Field "${cleaned}" must be a number`,
              });
              rowIsValid = false;
              break;
            }

            row[mappedKey as NumericKeys] = Number(value);
            continue;
          }

          /* property-type enums --------------------------------------------- */
          if (permissionKeys.includes(mappedKey as SinglePermissionKeys)) {
            // console.log(
            //   row,
            //   'row before property type check',
            //   mappedKey,
            //   'and values is',
            //   value,
            // );
            if (!Object.values(PropertyType).includes(value) && value != '') {
              // console.log(`Row ${r + 1}: Invalid PropertyType "${value}"`);
              skippedRows.push({
                row: r + 1,
                reason: `Invalid PropertyType "${value}"`,
              });
              rowIsValid = false;
              break;
            }
            row[mappedKey as SinglePermissionKeys] = value as PropertyType;
            continue;
          }

          /* string fields ---------------------------------------------------- */
          if (stringKeys.includes(mappedKey as StringKeys)) {
            row[mappedKey as any] = String(value) as any;
            continue;
          }
        }

        // Skip this row if validation failed
        if (!rowIsValid) {
          // console.log(`Row ${r + 1}: Skipped due to validation failure`);
          continue;
        }

        /* required keys check ------------------------------------------------ */
        const required: (keyof SubDevelopmentRow)[] = [
          'developmentName',
          'subDevelopment',
          'plotNumber',
          'plotHeight',
          'plotStatus',
        ];
        for (const k of required) {
          if (
            row[k] === undefined ||
            row[k] === null ||
            (typeof row[k] === 'string' && row[k] === '')
          ) {
            // console.log(`Row ${r + 1}: Missing required field "${k}"`);
            skippedRows.push({
              row: r + 1,
              reason: `Missing required field "${k}"`,
            });
            rowIsValid = false;
            break;
          }
        }

        // Skip this row if required fields validation failed
        if (!rowIsValid) {
          // console.log(`Row ${r + 1}: Skipped due to missing required fields`);
          continue;
        }

        /* consolidate plotPermission array ---------------------------------- */
        permissionKeys.forEach((k) => {
          const val = row[k];
          if (val) (row.plotPermission as PropertyType[]).push(val);
          delete row[k];
        });

        /* derived field ------------------------------------------------------ */
        row.totalAreaSqFt =
          (row.buaAreaSqFt || 0) +
          (row.facilitiesAreaSqFt || 0) +
          (row.amentiesAreaSqFt || 0);

        if (row.plotPermission.length === 0) {
          // console.log(`Row ${r + 1}: No permissions found`);
          skippedRows.push({
            row: r + 1,
            reason: 'Must have at least one permission',
          });
          continue;
        }

        // console.log(`Row ${r + 1}: Validated successfully:`, row);
        formattedData.push(row as SubDevelopmentRow);
      }

      // console.log('Validation complete. Valid rows:', formattedData.length, 'Skipped rows:', skippedRows.length);

      /* --------------------------------------------------------------------- */
      /* 3️⃣  Map to master development IDs                                    */
      /* --------------------------------------------------------------------- */
      const devList =
        await this.masterDevelopmentService.getAllMasterDevelopment([
          '_id',
          'developmentName',
        ]);
      const devMap = new Map(devList.map((d) => [d.developmentName, d._id]));

      const mappedData: (SubDevelopmentRow & {
        masterDevelopment: string;
        user: string;
      })[] = [];

      for (let i = 0; i < formattedData.length; i++) {
        const row = formattedData[i];
        const id = devMap.get(row.developmentName.trim());
        if (!id) {
          skippedRows.push({
            row: i + 1,
            reason: `No master development found for "${row.developmentName}"`,
          });
          continue;
        }
        mappedData.push({
          ...row,
          masterDevelopment: id as string,
          user: userId,
        });
      }

      /* --------------------------------------------------------------------- */
      /* 4️⃣  Deduplicate by subDevelopment + plotNumber                       */
      /* --------------------------------------------------------------------- */
      const seen = new Set<string>();
      const uniqueData = mappedData.filter((r) => {
        const key = `${r.subDevelopment.trim()}|${r.plotNumber.trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Check against existing database records
      const existingDocs = await this.subDevelopmentModel
        .find({
          $or: uniqueData.map((row) => ({
            subDevelopment: row.subDevelopment.trim(),
            plotNumber: row.plotNumber.trim(),
          })),
        })
        .select('subDevelopment plotNumber')
        .lean();

      const existingKeys = new Set(
        existingDocs.map(
          (doc) => `${doc.subDevelopment.trim()}|${doc.plotNumber.trim()}`,
        ),
      );

      const filteredList = uniqueData.filter((row) => {
        const key = `${row.subDevelopment.trim()}|${row.plotNumber.trim()}`;
        return !existingKeys.has(key);
      });

      // console.log('Total entries from file:', jsonData.length);
      // console.log('Valid entries after validation:', formattedData.length);
      // console.log('Entries after internal deduplication:', uniqueData.length);
      // console.log('Existing records found in DB:', existingDocs.length);
      // console.log('Final entries to insert:', filteredList.length);
      // console.log(filteredList, 'here is filtered List');

      if (filteredList.length === 0) {
        fs.unlinkSync(filePath);
        return {
          success: true,
          totalEntries: jsonData.length,
          insertedEntries: 0,
          skippedDuplicateEntries: uniqueData.length,
          skippedRows: skippedRows,
        };
      }

      /* --------------------------------------------------------------------- */
      /* 5️⃣  Batch insert (5 000 records each)                                */
      /* --------------------------------------------------------------------- */
      const batchSize = 5000;
      let inserted = 0;
      const errors: { start: number; end: number; error: string }[] = [];

      for (let i = 0; i < filteredList.length; i += batchSize) {
        const chunk = filteredList.slice(i, i + batchSize);
        try {
          const res = await this.subDevelopmentModel.insertMany(chunk);
          inserted += res.length;
        } catch (e) {
          errors.push({
            start: i,
            end: Math.min(i + batchSize, filteredList.length),
            error: e.message,
          });
        }
      }

      fs.unlinkSync(filePath);

      return {
        success: errors.length === 0,
        totalEntries: jsonData.length,
        insertedEntries: inserted,
        skippedDuplicateEntries: formattedData.length - filteredList.length,
        skippedRows: skippedRows,
        failedBatches: errors,
      };
    } catch (err) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async delete(id: string): Promise<void> {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const project = await this.ProjectModel.findOne(
        { subDevelopment: id },
        null,
        { session },
      );

      await this.subDevelopmentModel.findOneAndDelete({ _id: id }, { session });

      await this.ProjectModel.deleteMany({ subDevelopment: id }, { session });

      if (project) {
        await this.InventoryModel.deleteMany(
          { project: project._id },
          { session },
        );
      }

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
