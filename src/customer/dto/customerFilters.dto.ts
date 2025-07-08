import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import {
  CustomerSegment,
  CustomerCategory,
  CustomerSubCategory,
  CustomerType,
  CustomerSubType,
} from 'utils/enum/enums';

export class FilterCustomerDTO {
  @IsOptional()
  @IsEnum(CustomerSegment)
  customerSegment?: CustomerSegment;

  @IsOptional()
  @IsEnum(CustomerCategory)
  customerCategory?: CustomerCategory;

  @IsOptional()
  @IsEnum(CustomerSubCategory)
  customerSubCategory?: CustomerSubCategory;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?:  string | string[];
  

     @IsOptional()
  @IsString()
  customerBusinessSector?: string;

  
  @IsOptional()
  @IsEnum(CustomerSubType)
  customerSubType?: string | string[];

  @IsOptional()
  @IsString()
  customerNationality?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  customerDepartment?: string;

  @IsOptional()
  @IsString()
  customerDesignation?: string;

  @IsOptional()
  @IsString()
  telOffice?: string;

  @IsOptional()
  @IsString()
  tellDirect?: string;

  @IsOptional()
  @IsString()
  mobile1?: string;

  @IsOptional()
  @IsString()
  mobile2?: string;

  @IsOptional()
  @IsString()
  emailAddress?: string;

  @IsOptional()
  @IsString()
  webAddress?: string;

  @IsOptional()
  @IsString()
  officeLocation?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
