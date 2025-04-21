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

  @Prop({ required: true, unique: true, trim: true })
  subDevelopment: string;

  @Prop({ required: true })
  plotNumber: number;

  @Prop({ required: true })
  plotHeight: number;

  @Prop({ enum: PropertyType, required: true })
  plotPermission: string;

  @Prop({ required: true })
  plotSizeSqFt: number;

  @Prop({ required: true })
  plotBUASqFt: number;

  @Prop({ enum: PlotStatus, required: true })
  plotStatus: string;

  @Prop({ required: true })
  buaAreaSqFt: number;

  @Prop({ required: true })
  facilitiesAreaSqFt: number;

  @Prop({ required: true })
  amenitiesAreaSqFt: number;

  @Prop({ required: true })
  totalSizeSqFt: number;

  @Prop({ type: [String] })
  pictures: string[];

  @Prop({ type: [String], enum: FacilitiesCategory, required: true })
  facilitiesCategories: string[];

  @Prop({ type: [String], enum: AmenitiesCategory, required: true })
  amentiesCategories: string[];
}

export const SubDevelopmentSchema =
  SchemaFactory.createForClass(SubDevelopment);
