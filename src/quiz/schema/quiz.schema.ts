import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';


@Schema({
  timestamps: true,
})

@ObjectType() 
export class Quiz  extends Document {
  
  @Field(() => User)
  @Prop({ type: Types.ObjectId, ref: 'User' }) 
  deScopeId: Types.ObjectId;

  @Field(() => String) 
  @Prop({ type: String, required: true })
  marks: string;

  @Field(() => String) 
  @Prop({ type: String, required: true })
  subject: string;

  @Field(() => String) 
  @Prop({ type: String, required: true })
  difficulty: string;

  @Field(() => String) 
  @Prop({ type: String, required: true })
  level: string;

  @Field(() => String) 
  @Prop({ type: String, required: true })
  subBranch: string;

  @Field(() => Date)  // Include createdAt field
  createdAt: Date;


}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

