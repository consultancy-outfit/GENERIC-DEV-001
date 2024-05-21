import { SchemaFactory, Prop, Schema } from '@nestjs/mongoose';
import mongoose, { SchemaTypes, Types } from 'mongoose';
import { AbstractSchema } from '../common/abstracts/schema/abstract.schema';
import {
  VerificationStatusEnum,
} from '../constants/enums';

@Schema({
  collection: 'users',
  versionKey: false,
  timestamps: true,
})
export class User extends AbstractSchema<string> {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true, select: false })
  password: string;

  @Prop({ type: Boolean, required: false })
  temporaryPassword: boolean;

  @Prop({ type: String, required: false })
  firstName?: string;

  @Prop({ type: String, required: false })
  lastName?: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: Date, required: false })
  dob: Date;

  @Prop({ type: String, required: false })
  contactNumber: string;

  @Prop({ type: String, required: false })
  gender: string;

  @Prop({ type: String, required: true })
  defaultRole: string;

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;

  @Prop({ type: String, required: false })
  profileImage?: string;

  @Prop({ type: [Object], required: false })
  userPermissions?: object[];

  @Prop({
    type: String,
    enum: VerificationStatusEnum,
    default: VerificationStatusEnum.NOT_STARTED,
    required: false,
  })
  verificationStatus: string;

  @Prop({ type: String, required: false })
  verificationId?: string;

  @Prop({ type: String, required: false })
  verifiedPhoneNumber?: string;

  @Prop({ type: String, required: false })
  createdBy?: string;

  @Prop({ type: SchemaTypes.Mixed, required: false })
  address?: {
    addressLine?: string;
    suiteApt?: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };

  @Prop({ type: Boolean, required: false, default: false })
  allowPushNotification?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
