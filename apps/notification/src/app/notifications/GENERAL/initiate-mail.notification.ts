import { DatabaseChannel } from '../../channels/database.channel';
import { EmailChannel } from '../../channels/email.channel';
import { Notification } from '../../interfaces/notification.interface';
import type { ISendMailOptions } from '@nestjs-modules/mailer';

export class InitiateMailNotification implements Notification {
  private data: ISendMailOptions & { notification?: any };
  private template: string;

  constructor(data: ISendMailOptions & { notification?: any }) {
    this.data = data;
    this.template = 'general';
  }

  public sendToChannels() {
    return !this.data.notification
      ? [EmailChannel]
      : [EmailChannel, DatabaseChannel];
  }

  toEmail() {
    return {
      template: this.template,
      email: this.data.to,
      subject: this.data.subject,
      ccEmail: this.data.cc,
      data: this.data,
      message: this.data.text as string,
    };
  }

  toDatabase() {
    return this.data.notification;
  }
}
