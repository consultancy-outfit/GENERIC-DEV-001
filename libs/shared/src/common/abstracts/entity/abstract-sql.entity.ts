import { UUID, literal } from 'sequelize';
import {
  BeforeBulkCreate,
  BeforeCreate,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { v4 } from 'uuid';

@Table({
  timestamps: true,
})
export class AbstractSQLEntity<T> extends Model<T> {
  @Column({
    type: DataType.UUID,
    unique: true,
    allowNull: false,
    primaryKey: true,
    defaultValue: () => v4(),
  })
  id: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  createdAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  updatedAt?: Date;
}
