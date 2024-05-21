import { DatabaseChannel } from '../../channels/database.channel';
import { EmailChannel } from '../../channels/email.channel';
import {
  NOTIFICATION_PATTERNS,
  Role,
  VerificationStatusEnum,
} from '@shared/constants';
import { Notification } from '../../interfaces/notification.interface';

interface IData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  defaultRole: Role | string;
  status: VerificationStatusEnum;
}

export class UpdateOnboardingStatusNotification implements Notification {
  private data: IData;
  private message: string;
  private template: string;

  constructor(data: IData) {
    this.data = data;
    if (data.status == 'Approved') {
      this.message = 'Congratulation!! You account have been approved';
      this.template = 'onboarding-approved';
    } else {
      this.message = 'Sorry!! You account have been rejected';
      this.template = 'onboarding-rejected';
    }
  }

  public sendToChannels() {
    return [DatabaseChannel, EmailChannel];
  }

  toDatabase(): {
    userId: string;
    type: string;
    data: IData;
    title: string;
    message: string;
  } {
    return {
      title: 'Update Onboarding Status',
      message: this.message,
      type: NOTIFICATION_PATTERNS.GENERAL.NOTIFICATION_ONBOARDING_STATUS,
      userId: this.data.userId,
      data: this.data,
    };
  }

  toEmail(): {
    template: string;
    email: string;
    data: IData;
    subject: string;
    message: string;
  } {
    return {
      template: this.template,
      email: this.data.email,
      data: this.data,
      subject: this.message,
      message: '',
    };
  }
}
