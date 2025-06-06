import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Project } from 'src/project/schema/project.schema';
import { UnitPurpose, unitType } from 'utils/enum/enums';

@Schema({
  timestamps: true,
})
export class Inventory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Project;

  @Prop({ type: String, required: true })
  unitNumber: string;

  @Prop({ type: String })
  unitHeight: string;

  @Prop({ type: String })
  unitInternalDesign: string;

  @Prop({ type: String })
  unitExternalDesign: string;

  @Prop({ type: Number })
  plotSizeSqFt: number;

  @Prop({ type: Number })
  BuaSqFt: number;

  @Prop({ type: Number })
  noOfBedRooms: number;

  @Prop({ type: String, enum: unitType, default: unitType.BEDROOM })
  unitType: string;

  @Prop({ type: String })
  rentedAt: string;

  @Prop({ type: String })
  rentedTill: string;

  @Prop({ type: Number })
  rentalPrice: number;

  @Prop({ type: [String] })
  unitView: string[];

  @Prop({ type: String, enum: UnitPurpose })
  unitPurpose: string;

  @Prop({ type: String })
  listingDate: string;

  @Prop({ type: Number })
  purchasePrice: number;

  @Prop({ type: Number })
  marketPrice: number;

  @Prop({ type: Number })
  askingPrice: number;

  @Prop({ type: Number })
  premiumAndLoss: number;

  @Prop({ type: Number })
  marketRent: number;

  @Prop({ type: Number })
  askingRent: number;

  @Prop({ type: [String] })
  pictures: string[];

  @Prop({ type: Number })
  paidTODevelopers: number;

  @Prop({ type: Number })
  payableTODevelopers: number;
}
// @Prop({ type: String })
// chequeFrequency: string;

// @Prop({ type: Number })
// salePrice: number;

// unit Tenancy Detail

// @Prop({ type: String })
// vacantOn: string;

// Payment Detail
// @Prop({ type: Number })
// originalPrice: number;

export const InventorySchema = SchemaFactory.createForClass(Inventory);
