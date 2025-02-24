import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class RangeInput {
  @Field({ nullable: true }) min?: number;
  @Field({ nullable: true }) max?: number;
}


@InputType()
export class PropertyFilterInput {
  @Field({ nullable: true }) _id?: string;
  @Field({ nullable: true }) roadLocation?: string;
  @Field({ nullable: true }) developmentName?: string;
  @Field({ nullable: true }) subDevelopmentName?: string;
  @Field({ nullable: true }) projectName?: string;
  @Field({ nullable: true }) propertyType?: string;
  @Field({ nullable: true }) projectLocation?: string;
  @Field({ nullable: true }) unitNumber?: string;
  @Field({ nullable: true }) unitLocation?: string;
  @Field({ nullable: true }) vacancyStatus?: string;
  @Field({ nullable: true }) listed?: boolean;
  
  @Field({ nullable: true }) startDate?: string;  // Add startDate
  @Field({ nullable: true }) endDate?: string;    // Add endDate
  
  @Field(() => RangeInput, { nullable: true }) bedrooms?: RangeInput;
  @Field(() => RangeInput, { nullable: true }) primaryPriceRange?: RangeInput;
  @Field(() => RangeInput, { nullable: true }) resalePriceRange?: RangeInput;
  @Field(() => RangeInput, { nullable: true }) rentRange?: RangeInput;

  // New: Allow searching for multiple tags in unitView
  @Field(() => [String], { nullable: true })
  unitView?: string[];
  
}