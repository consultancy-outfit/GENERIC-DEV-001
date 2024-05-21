import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '../interfaces/notification-channel.interface';
import { Notification } from '../interfaces/notification.interface';
import { NotificationRepository } from '@shared/repository';

@Injectable()
export class DatabaseChannel implements NotificationChannel {
  constructor(private notificationRepo: NotificationRepository) {}

  public async send(notification: Notification): Promise<void> {
    const db_notification = notification.toDatabase();
    const _notification = {
      userId: db_notification?.userId,
      ...(db_notification?.userIds?.length && {
        userIds: db_notification?.userIds,
      }),
      type: db_notification?.type,
      data: db_notification?.data || {},
      title: db_notification?.title || '',
      message: db_notification?.message || '',
      icon: db_notification?.icon,
    };
    await this.notificationRepo.create(_notification);
  }

  getData(notification: Notification) {
    return notification.toDatabase();
  }
}
