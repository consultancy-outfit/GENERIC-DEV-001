import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema()
export class AbstractSchema<T = Types.ObjectId | string> {
  @Prop({ type: SchemaTypes.ObjectId })
  _id?: T | Types.ObjectId;
}
