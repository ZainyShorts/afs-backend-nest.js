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

  @Prop({ default: 0 })
  plotNumber: number;

  @Prop({ default: 0 })
  plotHeight: number;

  @Prop({ enum: PropertyType, type: [String], required: true })
  plotPermission: string[];

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

  @Prop({ type: [String], enum: FacilitiesCategory, required: true })
  facilitiesCategories: string[];

  @Prop({ type: [String], enum: AmenitiesCategory, required: true })
  amentiesCategories: string[];
}

export const SubDevelopmentSchema =
  SchemaFactory.createForClass(SubDevelopment);
