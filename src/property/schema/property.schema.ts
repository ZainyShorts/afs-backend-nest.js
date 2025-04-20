import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';

// Agent Schema
@ObjectType()
@Schema({
  timestamps: true,
})
export class Property extends Document {
  //   @Field(() => Document)
  //   @Prop({ type: Types.ObjectId, ref: 'Document' })
  //   documents: Types.ObjectId;

  //   @Field(() => Agent)
  //   @Prop({ type: Types.ObjectId, ref: 'Agent' })
  //   agent: Types.ObjectId;

  //   @Field(() => Maintenance)
  //   @Prop({ type: Types.ObjectId, ref: 'Maintenance' })
  //   maintenance: Types.ObjectId;

  //   @Field(() => Reviews)
  //   @Prop({ type: Types.ObjectId, ref: 'Reviews' })
  //   reviews: Types.ObjectId;

  //   @Field(() => Transactions)
  //   @Prop({ type: Types.ObjectId, ref: 'Transactions' })
  //   transactions: Types.ObjectId;

  // @Field(() => Leads)
  //   @Prop({ type: Types.ObjectId, ref: 'Leads' })
  //   leads: Types.ObjectId;

  // @Field(() => Appointment)
  //   @Prop({ type: Types.ObjectId, ref: 'Appointment' })
  //   appointment: Types.ObjectId;

  // @Field(() => Invoice)
  //   @Prop({ type: Types.ObjectId, ref: 'Invoice' })
  //   invoice: Types.ObjectId;

  // @Field(() => Client)
  //   @Prop({ type: Types.ObjectId, ref: 'Client' })
  //   client: Types.ObjectId;

  // @Field(() => Contract)
  //   @Prop({ type: Types.ObjectId, ref: 'Contract' })
  //   contract: Types.ObjectId;

  //Document id
  @Field(() => String, { nullable: false })
  _id: Types.ObjectId;

  //Reference other  documents
  @Field(() => User)
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Field(() => String)
  @Prop({ type: String })
  clerkId: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  roadLocation: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  developmentName: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  subDevelopmentName: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  projectName: string;

  @Field(() => String)
  @Prop({
    type: String,
    // , enum: propertyTypes
  })
  propertyType: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  propertyHeight: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  projectLocation: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  unitNumber: string;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null })
  bedrooms: number;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  unitLandSize: string;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null })
  unitBua: number;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  unitLocation: string;

  @Field(() => [String], { nullable: true })
  @Prop({ type: [String] })
  unitView: string[];

  @Field(() => [String], { nullable: true })
  @Prop({ type: [String] })
  propertyImages: string[];

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  Purpose: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, default: null })
  vacancyStatus?: string;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null })
  primaryPrice: number;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null })
  resalePrice: number;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null })
  premiumAndLoss: number;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null })
  Rent: number;

  @Field(() => Number, { nullable: true })
  @Prop({ type: Number, default: null })
  noOfCheques: number;

  //   Boolean
  @Field(() => Boolean)
  @Prop({ type: Boolean, default: false })
  listed: boolean;

  @Field(() => Date) // Make createdAt nullable
  createdAt: Date;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
