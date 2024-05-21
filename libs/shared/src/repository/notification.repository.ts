import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Notification } from '../schemas/notification.schema';
import { AbstractRepository } from '../common/abstracts/repository/abstract.repository';

@Injectable()
export class NotificationRepository extends AbstractRepository<Notification> {
  protected readonly logger = new Logger(NotificationRepository.name);
  constructor(
    @InjectModel(Notification.name) notificationModel: Model<Notification>,
    @InjectConnection() connection: Connection
  ) {
    super(notificationModel, connection);
  }
}
