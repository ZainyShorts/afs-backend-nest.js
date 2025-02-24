import { IsString, IsNumber, IsBoolean, IsArray, IsEnum, IsMongoId } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';
import { propertyTypes } from 'utils/enum/enums';

@InputType()
export class UpdatePropertyDto {

  @Field(() => String)
  @IsMongoId()
  _id: string; 

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

  @Field(() => String)
  @IsString()
  propertyHeight: string;

  @Field(() => String)
  @IsString()
  projectLocation: string;

  @Field(() => String)
  @IsString()
  unitNumber: string;

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