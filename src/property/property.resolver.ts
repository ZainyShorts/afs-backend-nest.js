import { Args, Query, Resolver } from '@nestjs/graphql';
import { PropertyService } from './property.service';
import { Property } from './schema/property.schema';
import { PropertyFilterInput } from './input/propertyFilterInput';
import { AddPropertyDto } from './input/addPropertyInput';

@Resolver()
export class PropertyResolver {

    constructor(private readonly propertyService: PropertyService) {}

  @Query(() => [Property])
  async getProperties(
    @Args('filter', { type: () => PropertyFilterInput, nullable: true }) filter?: PropertyFilterInput,
    @Args('page', { type: () => Number, nullable: true, defaultValue: 1 }) page?: number,
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 10 }) limit?: number,
    @Args('sortBy', { type: () => String, nullable: true, defaultValue: 'createdAt' }) sortBy?: string,
    @Args('sortOrder', { type: () => String, nullable: true, defaultValue: 'desc' }) sortOrder?: string
  ): Promise<Property[]> {
    console.log(filter, page, limit, sortBy, sortOrder)
    return this.propertyService.getProperties(filter, page, limit, sortBy, sortOrder);
  }

  @Query(() => Property, { nullable: true })
    async getProperty(@Args('docId', { type: () => String }) docId: string): Promise<Property> {
        return this.propertyService.getSingleRecord(docId);
    }
}
