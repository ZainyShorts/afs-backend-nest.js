import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MasterDevelopment } from 'src/masterdevelopment/schema/master-development.schema';
import {
  AmenitiesCategory,
  FacilitiesCategory,
  PlotStatus,
  PropertyType,
} from 'utils/enum/enums';

@Schema({ timestamps: true })
export class SubDevelopment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'MasterDevelopment', required: true })
  masterDevelopment: MasterDevelopment;

  @Prop({ required: true, trim: true })
  subDevelopment: string;

  @Prop({ required: true, trim: true })
  plotNumber: string;

  @Prop({ required: true })
  plotHeight: number;

  @Prop({ required: true })
  plotPermission: PropertyType[];

  @Prop({ default: 0 })
  plotSizeSqFt: number;

  @Prop({ default: 0 })
  plotBUASqFt: number;

  @Prop({ enum: PlotStatus, required: true })
  plotStatus: string;

  @Prop({ default: 0 })
  buaAreaSqFt: number;

  @Prop({ default: 0 })
  facilitiesAreaSqFt: number;

  @Prop({ default: 0 })
  amenitiesAreaSqFt: number;

  @Prop({ default: 0 })
  totalAreaSqFt: number;

  @Prop({ type: [String] })
  pictures: string[];

  @Prop({ type: [String], enum: FacilitiesCategory })
  facilitiesCategories: string[];

  @Prop({ type: [String], enum: AmenitiesCategory })
  amentiesCategories: string[];
}

export const SubDevelopmentSchema =
  SchemaFactory.createForClass(SubDevelopment);
