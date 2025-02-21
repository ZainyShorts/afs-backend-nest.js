import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


@Schema({
  timestamps: true,
})

@ObjectType() // Add this decorator
export class User extends Document {
  @Field(() => String) 
  @Prop({ type: Types.ObjectId }) 
  deScopeId: string;

  @Field(() => String) 
  @Prop({ type: String, required: true })
  username: string;

  @Field(() => String) 
  @Prop({ type: String, required: true, unique: [true, "Duplicate Email Entry"] })
  email: string;

  @Field(() => Boolean) 
  @Prop({ type: Boolean, default:false })
  subscription: boolean;
  
}



export const UserSchema = SchemaFactory.createForClass(User);