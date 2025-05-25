import { IsString, IsNumber, IsArray, IsEnum } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { UnitPurpose } from 'utils/enum/enums';

@InputType()
export class CreateInventorytDto {
  @Field(() => String)
  @IsString()
  projectName: string;

  // @Field(() => String)
  // @IsEnum(PropertyType)
  // propertyType: string;

  @Field(() => String)
  @IsString()
  unitNumber: string;

  @Field(() => String)
  @IsString()
  unitHeight: string;

  @Field(() => String)
  @IsString()
  unitInternalDesign: string;

  @Field(() => String)
  @IsNumber()
  unitExternalDesign: string;

  @Field(() => Number)
  @IsNumber()
  plotSizeSqFt: number;

  @Field(() => Number)
  @IsNumber()
  BuaSqFt: number;

  @Field(() => Number)
  @IsString()
  noOfBedRooms: number;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  unitView: string[];

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  pictures: string[];

  @Field(() => String)
  @IsEnum(UnitPurpose)
  unitPurpose: string;

  @Field(() => String)
  @IsEnum(UnitPurpose)
  unitType: string;

  @Field(() => String)
  @IsString()
  listingDate: string;

  @Field(() => String)
  @IsNumber()
  chequeFrequency: string;

  @Field(() => Number)
  @IsNumber()
  resalePrice: number;

  @Field(() => Number)
  @IsNumber()
  salePrice: number;

  @Field(() => Number)
  @IsNumber()
  rentedtAt: number;

  @Field(() => Number)
  @IsNumber()
  originalPrice: number;

  @Field(() => Number)
  @IsNumber()
  paidTODevelopers: number;

  @Field(() => Number)
  @IsNumber()
  payableTODevelopers: number;

  @Field(() => Number)
  @IsNumber()
  premiumAndLoss: number;
}
