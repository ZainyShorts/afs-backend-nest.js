import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UnitPurpose, unitType } from 'utils/enum/enums';

export class UpdateInventoryDto {
  @IsString()
  project: string;

  @IsString()
  unitNumber: string;

  @IsOptional()
  @IsNumber()
  unitHeight?: number;

  @IsOptional()
  @IsString()
  unitInternalDesign?: string;

  @IsOptional()
  @IsString()
  unitExternalDesign?: string;

  @IsOptional()
  @IsNumber()
  plotSizeSqFt?: number;

  @IsOptional()
  @IsNumber()
  BuaSqFt?: number;

  @IsEnum(unitType)
  unitType: string;

  @IsArray()
  @IsString({ each: true })
  unitView: string[];

  @IsArray()
  @IsString({ each: true })
  pictures: string[];

  @IsEnum(UnitPurpose)
  unitPurpose: string;

  @IsOptional()
  @IsString()
  listingDate?: string;

  @IsOptional()
  @IsString()
  chequeFrequency?: string;

  @IsOptional()
  @IsNumber()
  rentalPrice?: number;

  @IsOptional()
  @IsNumber()
  salePrice?: number;

  @IsOptional()
  @IsString()
  rentedAt?: string;

  @IsOptional()
  @IsString()
  rentedTill?: string;

  @IsOptional()
  @IsString()
  vacantOn?: string;

  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @IsOptional()
  @IsString()
  paidTODevelopers?: string;

  @IsOptional()
  @IsString()
  payableTODevelopers?: string;

  @IsOptional()
  @IsNumber()
  premiumAndLoss?: number;
}
