// // user.schema.ts
// import { Schema, Document } from 'mongoose';

// export enum Role {
//   ADMIN = 'admin',
//   MANAGER = 'manager',
//   EMPLOYEE = 'employee',
//   AGENT = 'agent',
// }

// export interface User extends Document {
//   name: string;
//   email: string;
//   password: string;
//   role: Role;
//   access: boolean;
//   lastLogin: Date;
// }

// export const UserSchema = new Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: Role, default: Role.EMPLOYEE },
//     access: { type: Boolean, default: true },
//     lastLogin: { type: Date, default: null },
//     attempts: { type: Number, default: 3 },
//     ban: { type: Boolean, default: false },
//     lastOtp: { type: String, maxLength: 6 },
//   },
//   { timestamps: true },
// );
// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  AGENT = 'agent',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: Role, default: Role.EMPLOYEE })
  role: Role;

  @Prop({ default: true })
  access: boolean;

  @Prop({ default: null })
  lastLogin: Date;

  @Prop({ default: 3 })
  attempts: number;

  @Prop({ default: false })
  ban: boolean;

  @Prop({ maxlength: 6 })
  lastOtp: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
