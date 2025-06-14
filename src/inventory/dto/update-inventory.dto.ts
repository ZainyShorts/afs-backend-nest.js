import { Field } from '@nestjs/graphql';
import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UnitPurpose, unitType } from 'utils/enum/enums';
import { paymentPlan, paymentPlanType } from '../schema/inventory.schema';

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

  @Field(() => [paymentPlan], { nullable: true })
  @IsOptional()
  @IsString()
  paymentPlan1?: paymentPlanType[];

  @Field(() => [paymentPlan], { nullable: true })
  @IsOptional()
  @IsString()
  paymentPlan2?: paymentPlanType[];

  @Field(() => [paymentPlan], { nullable: true })
  @IsOptional()
  @IsString()
  paymentPlan3?: paymentPlanType[];
}
