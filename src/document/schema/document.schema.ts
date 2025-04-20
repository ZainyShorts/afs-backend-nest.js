import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document as Doc } from 'mongoose';
import { FileType } from 'utils/enum/enums';

@Schema()
@Schema({
  timestamps: true,
})
export class Document extends Doc {
  @Prop({ required: true })
  refId: string;

  @Prop({ required: true, enum: FileType })
  type: string;

  @Prop({ required: true })
  documentUrl: string;

  @Prop({ required: true })
  title: string;
}

export const DocumentSchema = SchemaFactory.createForClass(Document);
