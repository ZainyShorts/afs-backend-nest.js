import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class PropertyFilterInput {
  @Field({ nullable: true }) _id?: string;
  @Field({ nullable: true }) roadLocation?: string;
  @Field({ nullable: true }) developmentName?: string;
  @Field({ nullable: true }) subDevelopmentName?: string;
  @Field({ nullable: true }) projectName?: string;
  @Field({ nullable: true }) propertyType?: string;
  @Field({ nullable: true }) projectLocation?: string;
  @Field({ nullable: true }) unitNumber?: number;
  @Field({ nullable: true }) bedrooms?: number;
  @Field({ nullable: true }) unitLocation?: string;
  @Field({ nullable: true }) vacancyStatus?: string;
  @Field({ nullable: true }) listed?: boolean;
}