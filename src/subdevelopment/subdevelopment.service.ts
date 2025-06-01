import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

@Injectable()
export class SubDevelopmentService {
  constructor(
    @InjectModel(SubDevelopment.name)
    private readonly subDevelopmentModel: Model<SubDevelopment>,
    private readonly masterDevelopmentService: MasterDevelopmentService,
  ) {}

  async create(dto: CreateSubDevelopmentDto): Promise<SubDevelopment> {
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

      const created = new this.subDevelopmentModel(dto);
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

        if (filter.plotNumber !== undefined) {
          query.plotNumber = filter.plotNumber;
        }

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

  async remove(id: string): Promise<any> {
    try {
      const result = await this.subDevelopmentModel
        .findByIdAndDelete(id)
        .exec();
      if (!result) {
        throw new NotFoundException(`SubDevelopment with id ${id} not found`);
      }
      return {
        success: true,
        message: `SubDevelopment with id ${id} has been deleted.`,
      };
    } catch (error) {
      console.error('Error deleting SubDevelopment:', error);
      throw new InternalServerErrorException(
        error?.message || 'An error occurred while deleting SubDevelopment.',
      );
    }
  }

  async import(filePath: string): Promise<any> {
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

      jsonData = jsonData.slice(0, 2);
      /* --------------------------------------------------------------------- */
      /* 2️⃣  Transform + strict-validate each row                              */
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

      for (let r = 0; r < jsonData.length; r++) {
        const raw = jsonData[r] as Record<string, any>;
        const row: Partial<SubDevelopmentRow> = { plotPermission: [] };

        for (const rawKey in raw) {
          const cleaned = rawKey.replace(/\n/g, '').trim();
          const mappedKey = SubDevelopmentheaderMapping[cleaned] as
            | keyof SubDevelopmentRow
            | undefined;
          const value = raw[rawKey];

          if (!mappedKey) continue; // ignore unknown columns

          /* enum validation -------------------------------------------------- */
          if (mappedKey === 'plotStatus') {
            if (!Object.values(PlotStatus).includes(value)) {
              return {
                success: false,
                message: `Invalid PlotStatus "${value}" in row ${r + 1}`,
              };
            }
            row.plotStatus = value;
            continue;
          }

          /* numeric validation ---------------------------------------------- */
          if (numericFields.includes(mappedKey as NumericKeys)) {
            if (value === '' || isNaN(Number(value))) {
              return {
                success: false,
                message: `Field "${cleaned}" must be a number (row ${r + 1})`,
              };
            }

            row[mappedKey as NumericKeys] = Number(value);
            continue;
          }

          /* property-type enums --------------------------------------------- */
          if (permissionKeys.includes(mappedKey as SinglePermissionKeys)) {
            console.log(
              row,
              'row before property type check',
              mappedKey,
              'and values is',
              value,
            );
            if (!Object.values(PropertyType).includes(value) && value != '') {
              return {
                success: false,
                message: `Invalid PropertyType "${value}" in row ${r + 1}`,
              };
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
            return {
              success: false,
              message: `Missing required field "${k}" in row ${r + 1}`,
            };
          }
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
          return {
            success: false,
            message: `must be at least one permission in row ${r + 1}`,
          };
        }

        formattedData.push(row as SubDevelopmentRow);
      }

      /* --------------------------------------------------------------------- */
      /* 3️⃣  Map to master development IDs                                    */
      /* --------------------------------------------------------------------- */
      const devList =
        await this.masterDevelopmentService.getAllMasterDevelopment([
          '_id',
          'developmentName',
        ]);
      const devMap = new Map(devList.map((d) => [d.developmentName, d._id]));

      const mappedData: (SubDevelopmentRow & { masterDevelopment: string })[] =
        [];

      for (let i = 0; i < formattedData.length; i++) {
        const row = formattedData[i];
        const id = devMap.get(row.developmentName.trim());
        if (!id) {
          return {
            success: false,
            message: `No master development found at row ${i + 1}`,
          };
        }
        mappedData.push({ ...row, masterDevelopment: id as string });
      }

      /* --------------------------------------------------------------------- */
      /* 4️⃣  Deduplicate by subDevelopment + plotNumber                       */
      /* --------------------------------------------------------------------- */
      const seen = new Set<string>();
      const uniqueData = mappedData.filter((r) => {
        const key = `${r.subDevelopment}-${r.plotNumber}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (uniqueData.length === 0) {
        fs.unlinkSync(filePath);
        return {
          success: true,
          totalEntries: jsonData.length,
          insertedEntries: 0,
          skippedDuplicateEntries: 0,
        };
      }

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
          (doc) => `${doc.subDevelopment.trim()}|${doc.plotNumber}`,
        ),
      );

      const filteredList = uniqueData.filter((row) => {
        const key = `${row.subDevelopment.trim()}|${row.plotNumber.trim()}`;
        return !existingKeys.has(key);
      });

      console.log(filteredList, 'here is filtered List');
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
        failedBatches: errors,
      };
    } catch (err) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Internal server error');
    }
  }
}
