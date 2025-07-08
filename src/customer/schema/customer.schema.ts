import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schema/user.schema';
import {
  CustomerSegment,
  CustomerCategory,
  CustomerSubCategory,
  CustomerType,
  CustomerSubType,
} from 'utils/enum/enums';

@Schema({ timestamps: true })
export class Customer extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  user?: User;

  @Prop({ enum: CustomerSegment, required: true })
  customerSegment: CustomerSegment;

  @Prop({ enum: CustomerCategory, required: true })
  customerCategory: CustomerCategory;

  @Prop({ enum: CustomerSubCategory, required: true })
  customerSubCategory: CustomerSubCategory;

  @Prop({ enum: CustomerType, required: true })
  customerType: CustomerType;

  @Prop({ enum: CustomerSubType, required: true })
  customerSubType: CustomerSubType;
    
    @Prop({ required: true, trim: true })
  customerBusinessSector: string;
   
  @Prop({ required: true, trim: true })
  customerNationality: string;

  @Prop({ required: true, trim: true })
  customerName: string;

  @Prop({ required: true, trim: true })
  contactPerson: string;

  @Prop({ required: false, trim: true })
  customerDepartment: string;

  @Prop({ required: false, trim: true })
  customerDesignation: string;

  @Prop({ required: false, trim: true })
  telOffice: string;

  @Prop({ required: false, trim: true })
  tellDirect: string;

  @Prop({ required: false, trim: true })
  mobile1: string;

  @Prop({ required: false, trim: true })
  mobile2: string;

  @Prop({ required: false, trim: true })
  emailAddress: string;

  @Prop({ required: false, trim: true })
  webAddress: string;

  @Prop({ required: false, trim: true })
  officeLocation: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
