import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { PropertyType } from 'utils/enum/enums';

@InputType()
export class CreateInventorytDto {
  @Field(() => String)
  @IsString()
  projectName: string;

  @Field(() => String)
  @IsEnum(PropertyType)
  propertyType: string;

  @Field(() => String)
  @IsString()
  unitHeight: string;

  @Field(() => String)
  @IsString()
  projectLocation: string;

  @Field(() => String)
  @IsString()
  unitNumber: string;

  @Field(() => Number)
  @IsNumber()
  noOfBedRooms: number;

  @Field(() => Number)
  @IsNumber()
  unitLandSize: number;

  @Field(() => Number)
  @IsNumber()
  unitBua: number;

  @Field(() => String)
  @IsString()
  unitLocation: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  unitView: string[];

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  propertyImages: string[];

  @Field(() => String)
  @IsString()
  Purpose: string;

  @Field(() => String)
  @IsString()
  vacancyStatus: string;

  @Field(() => Number)
  @IsNumber()
  primaryPrice: number;

  @Field(() => Number)
  @IsNumber()
  resalePrice: number;

  @Field(() => Number)
  @IsNumber()
  premiumAndLoss: number;

  @Field(() => Number)
  @IsNumber()
  Rent: number;

  @Field(() => Number)
  @IsNumber()
  noOfCheques: number;

  @Field(() => Boolean)
  @IsBoolean()
  listed: boolean;
}
