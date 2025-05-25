// user.schema.ts
import { Schema, Document } from 'mongoose';

export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  AGENT = 'agent',
}

export interface User extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  access: boolean;
  lastLogin: Date;
}

export const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: Role, default: Role.EMPLOYEE },
    access: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    attempts: { type: Number, default: 3 },
    ban: { type: Boolean, default: false },
    lastOtp: { type: String, maxLength: 6 },
  },
  { timestamps: true },
);
