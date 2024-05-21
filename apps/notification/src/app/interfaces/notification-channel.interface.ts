import { Notification } from './notification.interface';

export interface NotificationChannel {
  send(notification: Notification): Promise<void>;
}
