import { SchemaFactory, Prop, Schema } from '@nestjs/mongoose';
import mongoose, { SchemaTypes, Types } from 'mongoose';
import { AbstractSchema } from '../common/abstracts/schema/abstract.schema';
import { Role, VerificationStatusEnum } from '../constants/enums';

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

  @Prop({ type: String, required: false })
  companyName: string;

  @Prop({ type: String, required: false })
  crn: string;

  @Prop({ type: String, required: false })
  address: string;

  @Prop({ type: String, required: true, default: Role.USER })
  defaultRole: string;

  @Prop({ type: Boolean, default: false, required: true })
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

  @Prop({ type: Boolean, required: false, default: false })
  allowPushNotification?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
