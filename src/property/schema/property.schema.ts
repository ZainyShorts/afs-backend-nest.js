import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MasterDevelopment } from 'src/masterdevelopment/schema/master-development.schema';
import { Project } from 'src/project/schema/project.schema';
import { SubDevelopment } from 'src/subdevelopment/schema/subdevelopment.schema';
import { UnitPurpose, unitType } from 'utils/enum/enums';

@Schema({
  timestamps: true,
})
export class Property extends Document {
  @Prop({ type: Types.ObjectId, ref: 'MasterDevelopment', required: true })
  masterDevelopment: MasterDevelopment;

  @Prop({ type: Types.ObjectId, ref: 'SubDevelopment' })
  subDevelopment: SubDevelopment;

  @Prop({ type: Types.ObjectId, ref: 'ProjectDevelopment', required: true })
  project: Project;

  @Prop({ type: String, required: true })
  unitNumber: string;

  @Prop({ type: Number })
  unitHeight: number;

  @Prop({ type: String })
  unitInternalDesign: string;

  @Prop({ type: String })
  unitExternalDesign: string;

  @Prop({ type: Number })
  plotSizeSqFt: number;

  @Prop({ type: Number })
  BuaSqFt: number;

  @Prop({ type: String, enum: unitType })
  unitType: string;

  @Prop({ type: [String] })
  unitView: string[];

  @Prop({ type: [String] })
  pictures: string[];

  @Prop({ type: String, enum: UnitPurpose, required: true })
  unitPurpose: string;

  @Prop({ type: String })
  listingDate: string;

  @Prop({ type: String })
  chequeFrequency: string;

  @Prop({ type: Number, default: null })
  rentalPrice: number;

  @Prop({ type: Number, default: null })
  salePrice: number;

  // unit Tenancy Detail

  @Prop({ type: String })
  rentedAt: string;

  @Prop({ type: String })
  rentedTill: string;

  @Prop({ type: String })
  vacantOn: string;

  // Payment Detail
  @Prop({ type: Number })
  originalPrice: number;

  @Prop({ type: String })
  paidTODevelopers: string;

  @Prop({ type: String })
  payableTODevelopers: string;

  @Prop({ type: Number })
  premiumAndLoss: number;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
