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
  plotNumber: string;

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

  @Prop()
  constructionStatus: number;

  @Prop()
  commission: number;

  @Prop()
  launchDate: string;

  @Prop()
  height: string;

  @Prop()
  completionDate: string;

  @Prop({ enum: SalesStatus })
  salesStatus: SalesStatus;

  @Prop()
  downPayment: number;

  @Prop()
  percentOfConstruction: number;

  @Prop({ default: 0 })
  duringConstruction: number;

  @Prop()
  installmentDate: string;

  @Prop()
  uponCompletion: string;

  @Prop()
  postHandOver: string;

  @Prop([String])
  pictures: string[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
