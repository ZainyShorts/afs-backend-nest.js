import { Field } from '@nestjs/graphql';
import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UnitPurpose, unitType } from 'utils/enum/enums';

export class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  project?: string; // ObjectId string

  @IsOptional()
  @IsString()
  unitNumber?: string;

  @IsOptional()
  @IsString()
  unitHeight?: string;

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

  @IsOptional()
  @IsNumber()
  noOfBedRooms?: number;

  @IsOptional()
  @IsEnum(unitType)
  unitType?: string;

  @IsOptional()
  @IsString()
  rentedAt?: string;

  @IsOptional()
  @IsString()
  rentedTill?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unitView?: string[];

  @IsOptional()
  @IsEnum(UnitPurpose)
  unitPurpose?: string;

  @IsOptional()
  @IsString()
  listingDate?: string;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  marketPrice?: number;

  @IsOptional()
  @IsNumber()
  askingPrice?: number;

  @IsOptional()
  @IsNumber()
  premiumAndLoss?: number;

  @IsOptional()
  @IsNumber()
  marketRent?: number;

  @IsOptional()
  @IsNumber()
  askingRent?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pictures?: string[];

  @IsOptional()
  @IsString()
  paidTODevelopers?: string;

  @IsOptional()
  @IsString()
  payableTODevelopers?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  paymentPlan1?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  paymentPlan2?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  paymentPlan3?: number;
}
