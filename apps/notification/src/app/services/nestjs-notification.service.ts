import { Injectable, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Notification } from '../interfaces/notification.interface';
import { NotificationChannel } from '../interfaces/notification-channel.interface';
import { EmailChannel } from '../channels/email.channel';
import { DatabaseChannel } from '../channels/database.channel';

@Injectable()
export class NestJsNotification {
  private resolveChannel = (channel: Type<NotificationChannel>) => {
    return this.moduleRef.create(channel);
  };

  constructor(private moduleRef: ModuleRef) {}

  public send(notification: Notification): Promise<void[]> {
    const channels = notification.sendToChannels();
    return Promise.all(
      channels.map((channel: Type<DatabaseChannel | EmailChannel>) =>
        this.sendOnChannel(notification, channel)
      )
    );
  }

  private async sendOnChannel(
    notification: Notification,
    clientChannel: Type<NotificationChannel>
  ): Promise<void> {
    return (await this.resolveChannel(clientChannel)).send(notification);
  }
}
