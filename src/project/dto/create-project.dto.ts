// src/project/dto/create-project.dto.ts
import {
  IsString,
  IsEnum,
  IsArray,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import {
  PlotStatus,
  ProjectQuality,
  PropertyType,
  SalesStatus,
} from 'utils/enum/enums';

export class PlotDto {
  @IsNumber()
  plotNumber: number;

  @IsNumber()
  plotHeight: number;

  @IsArray()
  plotPermission: PropertyType[];

  @IsNumber()
  plotSizeSqFt: number;

  @IsNumber()
  plotBUASqFt: number;

  @IsString()
  plotStatus: PlotStatus;

  @IsNumber()
  buaAreaSqFt: number;
}

export class CreateProjectDto {
  @IsEnum(PropertyType)
  @IsNotEmpty()
  propertyType: PropertyType;

  @IsString()
  @IsNotEmpty()
  projectName: string;

  @IsArray()
  facilityCategories?: string[];

  @IsObject()
  plot?: PlotDto;

  @IsArray()
  amenitiesCategories?: string[];

  @IsEnum(ProjectQuality)
  @IsNotEmpty()
  projectQuality: ProjectQuality;

  @IsNumber()
  constructionStatus?: number;

  @IsString()
  launchDate?: string;

  @IsString()
  completionDate?: string;

  @IsEnum(SalesStatus)
  salesStatus: SalesStatus;

  @IsNumber()
  downPayment?: number;

  @IsNumber()
  percentOfConstruction?: number;

  @IsString()
  installmentDate?: string;

  @IsString()
  uponCompletion?: string;

  @IsString()
  postHandOver?: string;

  @IsString() @IsOptional() shops?: string;
  @IsString() @IsOptional() offices?: string;
  @IsString() @IsOptional() studios?: string;
  @IsString() @IsOptional() oneBr?: string;
  @IsString() @IsOptional() twoBr?: string;
  @IsString() @IsOptional() threeBr?: string;
  @IsString() @IsOptional() fourBr?: string;
  @IsString() @IsOptional() fiveBr?: string;
  @IsString() @IsOptional() sixBr?: string;
  @IsString() @IsOptional() sevenBr?: string;
  @IsString() @IsOptional() eightBr?: string;

  @IsNumber()
  total?: number;

  @IsNumber()
  sold?: number;

  @IsNumber()
  available?: number;

  @IsArray()
  pictures?: string[];
}
