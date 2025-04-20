import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query(() => String)
  testQuery(): string {
    return 'GraphQL setup is working!';
  }
}
