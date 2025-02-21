import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class addUserInput {
  @Field(()=>String)
  deScopeId: string;

  @Field(()=>String)
  username: string;

  @Field(()=>String)
  email: string;

  @Field(()=>String)
  timeZone: string;

}

