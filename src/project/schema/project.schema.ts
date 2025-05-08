// src/project/schemas/project.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MasterDevelopment } from 'src/masterdevelopment/schema/master-development.schema';
import { SubDevelopment } from 'src/subdevelopment/schema/subdevelopment.schema';
import {
  PlotStatus,
  ProjectQuality,
  PropertyType,
  SalesStatus,
} from 'utils/enum/enums';

export type ProjectDocument = Project & Document;

export class Plot {
  @Prop()
  plotNumber: number;

  @Prop()
  plotHeight: number;

  @Prop({ enum: PropertyType, type: [String] })
  plotPermission: string[];

  @Prop()
  plotSizeSqFt: number;

  @Prop()
  plotBUASqFt: number;

  @Prop({ enum: PlotStatus })
  plotStatus: string;

  @Prop()
  buaAreaSqFt: number;
}

@Schema({ timestamps: true })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'MasterDevelopment', required: true })
  masterDevelopment: MasterDevelopment;

  @Prop({ type: Types.ObjectId, ref: 'SubDevelopment' })
  subDevelopment: SubDevelopment;

  @Prop({ type: Plot })
  plot: Plot;

  @Prop({ enum: PropertyType, required: true })
  propertyType: PropertyType;

  @Prop({ required: true, unique: true, trim: true })
  projectName: string;

  @Prop([String])
  facilityCategories: string[];

  @Prop([String])
  amenitiesCategories: string[];

  @Prop({ enum: ProjectQuality, required: true })
  projectQuality: ProjectQuality;

  @Prop({ default: 0 })
  constructionStatus: number;

  @Prop({ default: 'N/A', trim: true })
  launchDate: string;

  @Prop({ default: 'N/A', trim: true })
  completionDate: string;

  @Prop({ enum: SalesStatus })
  salesStatus: SalesStatus;

  @Prop({ default: 0 })
  downPayment: number;

  @Prop({ default: 0 })
  percentOfConstruction: number;

  @Prop({ default: 'N/A', trim: true })
  installmentDate: string;

  @Prop({ default: 'N/A', trim: true })
  uponCompletion: string;

  @Prop({ default: 'N/A', trim: true })
  postHandOver: string;

  @Prop([String])
  pictures: string[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
