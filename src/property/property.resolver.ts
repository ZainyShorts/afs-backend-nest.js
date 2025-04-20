import { Args, Query, Resolver } from '@nestjs/graphql';
import { PropertyService } from './property.service';
import { Property } from './schema/property.schema';
import { PropertyFilterInput } from './input/propertyFilterInput';
import { PaginatedProperties } from './output/properties.dto';

@Resolver()
export class PropertyResolver {
  constructor(private readonly propertyService: PropertyService) {}

  @Query(() => PaginatedProperties)
  async getProperties(
    @Args('filter', { type: () => PropertyFilterInput, nullable: true })
    filter?: PropertyFilterInput,
    @Args('page', { type: () => String, nullable: true, defaultValue: 1 })
    page?: string,
    @Args('limit', { type: () => String, nullable: true, defaultValue: 10 })
    limit?: string,
    @Args('sortBy', {
      type: () => String,
      nullable: true,
      defaultValue: 'createdAt',
    })
    sortBy?: string,
    @Args('sortOrder', {
      type: () => String,
      nullable: true,
      defaultValue: 'desc',
    })
    sortOrder?: string,
  ): Promise<PaginatedProperties> {
    return this.propertyService.getProperties(
      filter,
      Number(page),
      Number(limit),
      sortBy,
      sortOrder,
    );
  }

  @Query(() => Property, { nullable: true })
  async getProperty(
    @Args('docId', { type: () => String }) docId: string,
  ): Promise<Property> {
    return this.propertyService.getSingleRecord(docId);
  }
}
