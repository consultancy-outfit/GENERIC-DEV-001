import { SchemaFactory, Prop, Schema } from '@nestjs/mongoose';
import { AbstractSchema } from '../common/abstracts/schema/abstract.schema';

@Schema({ collection: 'backups', versionKey: false, timestamps: true })
export class Backup extends AbstractSchema {
  @Prop({ type: String, required: true })
  file: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String, required: true })
  status: string;

  @Prop({ type: String, required: false })
  reason?: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const BackupSchema = SchemaFactory.createForClass(Backup);
