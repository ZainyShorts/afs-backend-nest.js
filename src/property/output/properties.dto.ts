import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Property } from '../schema/property.schema';

@ObjectType()
export class PaginatedProperties {
  @Field(() => [Property]) // Ensure Property is correctly imported and defined
  data: Property[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  pageNumber: number;
}
