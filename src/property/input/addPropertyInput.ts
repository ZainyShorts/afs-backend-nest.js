import { IsString, IsNumber, IsBoolean, IsArray, IsEnum, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';
import { Field, InputType } from '@nestjs/graphql';
import { propertyTypes } from 'utils/enum/enums';

@InputType()
export class AddPropertyDto {

  @Field(() => String)
  @IsMongoId()
  userId: Types.ObjectId;

  @Field(() => String)
  @IsString()
  clerkId: string;

  @Field(() => String)
  @IsString()
  roadLocation: string;

  @Field(() => String)
  @IsString()
  developmentName: string;

  @Field(() => String)
  @IsString()
  subDevelopmentName: string;

  @Field(() => String)
  @IsString()
  projectName: string;

  @Field(() => String)
  @IsEnum(propertyTypes)
  propertyType: string;

  @Field(() => Number)
  @IsNumber()
  propertyHeight: number;

  @Field(() => String)
  @IsString()
  projectLocation: string;

  @Field(() => Number)
  @IsNumber()
  unitNumber: number;

  @Field(() => Number)
  @IsNumber()
  bedrooms: number;

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