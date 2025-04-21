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
  roadLocation: string;

  @Prop({ required: true, unique: true, trim: true })
  developmentName: string;

  @Prop({ enum: LocationQuality, required: true })
  locationQuality: string;

  @Prop({ required: true })
  buaAreaSqFt: number;

  @Prop({ required: true })
  facilitiesAreaSqFt: number;

  @Prop({ required: true })
  amentiesAreaSqFt: number;

  @Prop({ required: true })
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
