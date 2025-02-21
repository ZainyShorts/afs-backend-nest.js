import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schema/user.schema';
import { propertyTypes } from 'utils/enum/enums';




// Agent Schema
@ObjectType()
@Schema()
export class Property extends Document {

  //Document id
  @Field(() => String) 
  _id: Types.ObjectId;

  //Reference other  documents
  @Field(() => User)
  @Prop({ type: Types.ObjectId, ref: 'User' }) 
  userId: Types.ObjectId;

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


  @Field(() => String) 
  @Prop({ type: String})
  clerkId: string;

  @Field(() => String) 
  @Prop({ type: String})
  roadLocation: string;

  @Field(() => String) 
  @Prop({ type: String})
  developmentName: string;

  @Field(() => String) 
  @Prop({ type: String})
  subDevelopmentName: string;

  @Field(() => String) 
  @Prop({ type: String})
  projectName: string;

  @Field(() => String) 
  @Prop({ type:String, enum: propertyTypes})
  propertyType: string; 

  @Field(() => Number) 
  @Prop({ type: Number})
  propertyHeight: number;

  @Field(() => String) 
  @Prop({ type: String})
  projectLocation: string;

  
  @Field(() => Number) 
  @Prop({ type: Number})
  unitNumber: number;

  @Field(() => Number) 
  @Prop({ type: Number})
  bedrooms: number;

  @Field(() => Number) 
  @Prop({ type: Number})
  unitLandSize: number;

  @Field(() => Number) 
  @Prop({ type: Number})
  unitBua: number;

  @Field(() => String) 
  @Prop({ type: String})
  unitLocation: string;


  @Field(() => [String]) 
  @Prop({ type: [String] }) 
  unitView: string[];

  @Field(() => [String]) 
  @Prop({ type: [String] }) 
  propertyImages: string[];

  @Field(() => String) 
  @Prop({ type: String})
  Purpose: string;

  @Field(() => String) 
  @Prop({ type: String})
  vacancyStatus: string;
  

  @Field(() => Number) 
  @Prop({ type: Number})
  primaryPrice: number;

  @Field(() => Number) 
  @Prop({ type: Number})
  resalePrice: number;

  @Field(() => Number) 
  @Prop({ type: Number})
  premiumAndLoss: number;

  @Field(() => Number) 
  @Prop({ type: Number})
  Rent: number;

  @Field(() => Number) 
  @Prop({ type: Number})
  noOfCheques: number;


//   Boolean 
  @Field(() => Boolean) 
  @Prop({ type: Boolean})
  listed: boolean;

  
  

}

export const PropertySchema = SchemaFactory.createForClass(Property);
