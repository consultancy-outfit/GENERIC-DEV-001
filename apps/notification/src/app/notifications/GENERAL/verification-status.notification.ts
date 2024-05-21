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

export class VerificationStatusNotification implements Notification {
  private data: IData;
  private message: string;
  private template: string;

  constructor(data: IData) {
    this.data = {
      ...data,
      defaultRole: data.defaultRole?.split('_')?.join(' ')?.toLowerCase(),
    };
    if (data.status == 'Approved') {
      this.message = 'Congratulation!! Your account have been approved';
      this.template = 'signup-approved';
    } else {
      this.message = 'Sorry!! Your account have been rejected';
      this.template = 'signup-rejected';
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
      title: 'Signup Verification Status Update',
      message: this.message,
      type: NOTIFICATION_PATTERNS.GENERAL.VERIFICATION_STATUS,
      userId: this.data.userId,
      data: this.data,
    };
  }
  toEmail(): {
    template: string;
    email: string;
    data: IData;
    subject: string;
    message?: string;
  } {
    return {
      template: this.template,
      email: this.data.email,
      data: this.data,
      subject: this.message,
      message: this.message,
    };
  }
}
