import { SchemaFactory, Prop, Schema } from '@nestjs/mongoose';
import { AbstractSchema } from '../common/abstracts/schema/abstract.schema';
import { Types } from 'mongoose';
import { User } from './user.schema';
@Schema({
  versionKey: false,
  timestamps: true,
})
export class AuditLog extends AbstractSchema {
  @Prop({ type: Types.ObjectId, required: true, ref: User.name })
  userId: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  role: string;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: String, required: true })
  ipAddress: string;

  @Prop({ type: String, required: true })
  eventName: string;

  @Prop({ type: String, required: true })
  eventDate: string;

  @Prop({ type: String, required: true })
  eventTime: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
