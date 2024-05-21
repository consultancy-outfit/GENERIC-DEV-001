import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '../interfaces/notification-channel.interface';
import { Notification } from '../interfaces/notification.interface';

@Injectable()
export class EmailChannel implements NotificationChannel {
  constructor(private mailerService: MailerService) {}

  public async send(notification: Notification): Promise<void> {
    const _notification = notification.toEmail();
    const options = {
      to: _notification.email,
      subject: _notification.subject,
      template: './' + _notification.template,
      context: {
        message: _notification.message,
        data: _notification.data,
      },
      ...(_notification.ccEmail && { cc: _notification.ccEmail }),
      ...(_notification?.attachments &&
        _notification?.attachments.length > 0 && {
          attachments: _notification.attachments,
        }),
    };
    if (_notification.from != null) {
      options['from'] =
        `"${_notification.from.name}" <${_notification.from.email}>`;
    }
    await this.mailerService.sendMail(options);
  }
}
