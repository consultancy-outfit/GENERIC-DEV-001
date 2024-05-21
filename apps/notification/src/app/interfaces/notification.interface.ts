import { Type } from '@nestjs/common';
import { NotificationChannel } from './notification-channel.interface';
import type { ISendMailOptions } from '@nestjs-modules/mailer';

export interface Notification {
  sendToChannels(): Type<NotificationChannel>[];
  toDatabase?(): {
    userId?: string;
    userIds?: string[];
    type: string;
    data: unknown;
    title: string;
    message?: string;
    icon?: string;
  };
  toEmail?(): {
    template: string;
    email: ISendMailOptions['to'];
    data: unknown;
    subject: string;
    attachments?: ISendMailOptions['attachments'];
    ccEmail?: ISendMailOptions['cc'];
    text?: string;
    message?: string;
    from?: { name: string; email: string };
  };
  toSMS?(): { message: string };
}
