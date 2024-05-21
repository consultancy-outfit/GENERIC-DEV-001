import { SchemaFactory, Prop, Schema } from '@nestjs/mongoose';
import { AbstractSchema } from '../common/abstracts/schema/abstract.schema';

@Schema({ collection: 'notifications', versionKey: false, timestamps: true })
export class Notification extends AbstractSchema {
  @Prop({ type: String, required: true, index: true, ref: 'users' })
  userId: string;

  @Prop({
    type: [{ type: String, required: true, index: true, ref: 'users' }],
    required: false,
  })
  userIds?: string[];

  @Prop({ type: String, required: false, ref: 'users' })
  notifiedBy?: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: Object, required: true })
  data: any;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, required: false })
  icon?: string;

  @Prop({ type: String, required: false, default: null })
  readAt?: Date | null;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
