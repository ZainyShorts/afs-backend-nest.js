import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsArray, IsBoolean } from 'class-validator';

// Topic Input
@InputType()
export class TopicInput {
  @Field(() => String)
  @IsString()
  title: string;

  @Field(() => String)
  @IsString()
  status: string;
}

// Course Input
@InputType()
export class CourseInput {
  @Field(() => [TopicInput])
  @IsArray()
  topics: TopicInput[];

  @Field(() => Boolean)
  @IsBoolean()
  courseComplete: boolean;
}

// Agent Input
@InputType()
export class CreateAgentInput {
  @Field(() => String)
  @IsString()
  name: string;

  @Field(() => [CourseInput])
  @IsArray()
  course: CourseInput[];
}
