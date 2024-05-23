import { EmailChannel } from '../../channels/email.channel';
import { Notification } from '../../interfaces/notification.interface';

interface IData {
  userId: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  password: string;
  link?: string;
}

export class SignupSuccessNotification implements Notification {
  private data: IData;
  private message: string;
  private template: string;

  constructor(data: IData) {
    this.data = {
      ...data,
      link: `https://${process.env.FE_BASE_URI}/set-new-password?email=${data.email}`,
    };
    this.message =
      "Congratulations! You're onboard! Welcome to Personnel Library";
    this.template = 'signup-success';
  }

  public sendToChannels() {
    return [EmailChannel];
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
