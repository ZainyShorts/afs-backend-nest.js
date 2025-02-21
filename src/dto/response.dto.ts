import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Quiz } from 'src/quiz/schema/quiz.schema';

@ObjectType()
export class ResponseDto {

  @Field(()=> Boolean)
  @IsNotEmpty()
  @IsBoolean()
  success: boolean;

  @Field(()=> Int)
  @IsNotEmpty()
  @IsNumber()
  statusCode: number;

  @IsOptional()
  data?: any; // If you want to validate `assistant`, you can replace `any` with a proper type or class.

  @Field(()=> String)
  @IsOptional()
  @IsString()
  msg?: string;
}

