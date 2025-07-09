import {
  Injectable,
  InternalServerErrorException, 
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';  
import * as XLSX from 'xlsx';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer } from './schema/customer.schema';
import { CustomerDTO } from './dto/addCustomer.dto'; 
import { FilterCustomerDTO } from './dto/customerFilters.dto'; 
import {
  CustomerCategory,
  CustomerSegment,
  CustomerSubCategory,
  CustomerSubType,
  CustomerType,
} from 'utils/enum/enums';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<Customer>,
  ) {}

   async create(customerData: CustomerDTO, userId: string): Promise<Customer> {
    try {
      if (!customerData.customerName) {
        throw new BadRequestException('Customer name is required');
      }

      const newCustomer = new this.customerModel({
        ...customerData,
        user: userId, 
      });

      return await newCustomer.save();
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException(
        'Failed to create customer. Please try again later.',
      );
    }
  } 
async findAll(
  filterDto: FilterCustomerDTO,
  page = 1,
  limit = 10,
  sortBy = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
): Promise<{ data: Customer[]; total: number }> {
  try {
    const {
      startDate,
      endDate,
      page: _p,
      limit: _l,
      sortOrder: _so,
      ...restFilters
    } = filterDto as any;

    const skip = (page - 1) * limit;
    const sortOptions: { [key: string]: 1 | -1 } = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = {};

    // Apply dynamic filters
    for (const [key, value] of Object.entries(restFilters)) {
      if (!value) continue;

      // Match array values
      if (Array.isArray(value)) {
        query[key] = { $in: value };
      }

      // Comma-separated string to $in array
      else if (typeof value === 'string' && value.includes(',')) {
        query[key] = { $in: value.split(',') };
      }

      else if (
        ['customerName', 'contactPerson','customerBusinessSector' ,'emailAddress', 'webAddress', 'officeLocation', 'customerNationality'].includes(key)
      ) {
        query[key] = { $regex: `^${value}`, $options: 'i' }; 
      }

      // Exact match
      else {
        query[key] = value;
      }
    }

    // Date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Execute paginated + filtered + sorted query
    const [data, total] = await Promise.all([
      this.customerModel
        .find(query)
        .select('-user') // exclude user field from result
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.customerModel.countDocuments(query),
    ]);

    return { data, total };
  } catch (error) {
    console.error('Error in findAll:', error);
    throw new InternalServerErrorException('Failed to fetch customers');
  }
}
 
async importCustomers(fileBuffer: Buffer, userId: string) {
  let workbook, sheet, records;

  try {
    workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    sheet = workbook.Sheets[workbook.SheetNames[0]];
    records = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as any[];
  } catch {
    throw new BadRequestException('Invalid Format');
  }

  if (!records || records.length === 0) {
    throw new BadRequestException('File has no valid data');
  }

  const fieldMap: Record<string, string> = {
    'Customer Segment': 'customerSegment',
    'Customer Category': 'customerCategory',
    'Customer Sub Category': 'customerSubCategory',
    'Customer Type': 'customerType',
    'Customer Sub Type': 'customerSubType',
    'Customer Business Sector': 'customerBusinessSector',
    'Customer Nationality': 'customerNationality',
    'Customer Name': 'customerName',
    'Contact Person': 'contactPerson',
    'Customer Department': 'customerDepartment',
    'Customer Designation': 'customerDesignation',
    'Tel Office': 'telOffice',
    'Tel Direct': 'tellDirect',
    'Mobile 1': 'mobile1',
    'Mobile 2': 'mobile2',
    'Email Address': 'emailAddress',
    'Web Address': 'webAddress',
    'Office Location': 'officeLocation',
  };

  const actualHeaders = Object.keys(records[0] || {});
  const expectedHeaders = Object.keys(fieldMap);
  const isHeaderMismatch = expectedHeaders.some(header => !actualHeaders.includes(header));

  if (isHeaderMismatch) {
    throw new BadRequestException('Invalid Format');
  }

  const validRecords: CustomerDTO[] = [];
  let invalidCount = 0;

  for (const rawRow of records) {
    try {
      const row: any = {};
      for (const [excelKey, camelKey] of Object.entries(fieldMap)) {
        row[camelKey] = rawRow[excelKey] || '';
      }

      const customer: CustomerDTO = {
        customerSegment: this.validateEnum(row.customerSegment, CustomerSegment),
        customerCategory: this.validateEnum(row.customerCategory, CustomerCategory),
        customerSubCategory: this.validateEnum(row.customerSubCategory, CustomerSubCategory),
        customerType: this.validateEnum(row.customerType, CustomerType),
        customerSubType: this.validateEnum(row.customerSubType, CustomerSubType),

        customerBusinessSector: row.customerBusinessSector,
        customerNationality: row.customerNationality,
        customerName: row.customerName,
        contactPerson: row.contactPerson,
        customerDepartment: row.customerDepartment,
        customerDesignation: row.customerDesignation,

        telOffice: row.telOffice,
        tellDirect: row.tellDirect,
        mobile1: row.mobile1,
        mobile2: row.mobile2,

        emailAddress: row.emailAddress,
        webAddress: row.webAddress,
        officeLocation: row.officeLocation,
      };

      if (!customer.customerName || !customer.contactPerson) {
        throw new Error('Required fields missing');
      }

      const doc = new this.customerModel({ ...customer, user: userId });
      validRecords.push(doc);
    } catch {
      invalidCount++;
    }
  }

  if (validRecords.length > 0) {
    await this.customerModel.insertMany(validRecords);
  }

  return {
    message: `${validRecords.length} successful and ${invalidCount} unsuccessful entries`,
    total: records.length,
    successCount: validRecords.length,
    errorCount: invalidCount,
  };
}




  private validateEnum(value: string, enumType: any): any {
    if (!Object.values(enumType).includes(value)) {
      throw new Error(`Invalid value: "${value}" for enum ${enumType.name}`);
    }
    return value;
  } 



async findById(id: string): Promise<Customer> {
  try {
    const customer = await this.customerModel.findById(id).select('-user').exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  } catch (error) {
    throw new InternalServerErrorException(error.message || 'Error retrieving customer');
  } 
}

 async update(id: string, dto: CustomerDTO, userId: string): Promise<any> {
    try {
      const updated = await this.customerModel
        .findByIdAndUpdate(
          id,
          { ...dto, user: userId }, 
          { new: true, runValidators: true },
        )
        .select('-user') 
        .exec();

      if (!updated) {
        throw new NotFoundException('Customer not found');
      }

      return updated;
    } catch (error) {
      throw new InternalServerErrorException(error.message || 'Failed to update customer');
    }
  }
 async deleteCustomer(customerId: string) {
  const deleted = await this.customerModel.findByIdAndDelete(customerId);

  if (!deleted) {
    throw new NotFoundException('Customer not found');
  }

  return {
    message: 'Customer deleted successfully',
    customerId: deleted._id,
  };
}
}
