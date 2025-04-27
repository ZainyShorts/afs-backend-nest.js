import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  AmenitiesCategory,
  FacilitiesCategory,
  LocationQuality,
} from 'utils/enum/enums';

@Schema()
@Schema({
  timestamps: true,
})
export class MasterDevelopment extends Document {
  @Prop({ required: true, trim: true })
  country: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  roadLocation: string;

  @Prop({ required: true, unique: true, trim: true })
  developmentName: string;

  @Prop({ enum: LocationQuality, required: true })
  locationQuality: string;

  @Prop({ default: 0 })
  buaAreaSqFt: number;

  @Prop({ default: 0 })
  facilitiesAreaSqFt: number;

  @Prop({ default: 0 })
  amentiesAreaSqFt: number;

  @Prop({ default: 0 })
  totalAreaSqFt: number;

  @Prop({ type: [String] })
  pictures: string[];

  @Prop({ type: [String], enum: FacilitiesCategory, required: true })
  facilitiesCategories: string[];

  @Prop({ type: [String], enum: AmenitiesCategory, required: true })
  amentiesCategories: string[];
}

export const MasterDevelopmentSchema =
  SchemaFactory.createForClass(MasterDevelopment);
