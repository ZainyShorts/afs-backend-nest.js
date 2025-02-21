import {  Field, ObjectType } from '@nestjs/graphql';


@ObjectType()
export class sessionIdOutput {
  
  @Field(() => String)
  id: string;
}