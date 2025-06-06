import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { UnitPurpose, unitType } from 'utils/enum/enums';

@InputType()
export class CreateInventorytDto {
  @Field(() => String)
  @IsString()
  project: string; // This should be the project ID (ObjectId as string)

  @Field(() => String)
  @IsString()
  unitNumber: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  unitHeight?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  unitInternalDesign?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  unitExternalDesign?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  plotSizeSqFt?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  BuaSqFt?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  noOfBedRooms?: number;

  @Field(() => String)
  @IsEnum(unitType)
  unitType: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  rentedAt?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  rentedTill?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  rentalPrice?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unitView?: string[];

  @Field(() => String)
  @IsEnum(UnitPurpose)
  unitPurpose: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  listingDate?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  marketPrice?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  askingPrice?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  premiumAndLoss?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  marketRent?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsNumber()
  askingRent?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pictures?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  paidTODevelopers?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  payableTODevelopers?: string;
}
