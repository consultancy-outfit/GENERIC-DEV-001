import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { UserNotificationService } from '../services/user-notification.service';
import { MESSAGE_PATTERNS, NoticeTypeEnum } from '@shared/constants';
import { Notification } from '@shared/schemas';

const {
  ALL_NOTIFICATIONS,
  DELETE_ALL_NOTIFICATIONS,
  DELETE_NOTIFICATION,
  READ_ALL_NOTIFICATIONS,
  READ_SINGLE_NOTIFICATION,
  SINGLE_NOTIFICATION,
  LATEST_NOTIFICATIONS,
  UNREAD_NOTIFICATIONS,
  UNREAD_ALL_NOTIFICATIONS,
} = MESSAGE_PATTERNS.NOTIFICATIONS;

@Controller()
export class UserNotificationController {
  constructor(private readonly notificationService: UserNotificationService) {}

  @MessagePattern(ALL_NOTIFICATIONS)
  async getAllNotifications(
    @Payload()
    payload: {
      userId: string;
      offset: number;
      limit: number;
      search?: string;
      startDate?: Date;
      endDate?: Date;
      noticeType?: NoticeTypeEnum;
    }
  ): Promise<unknown> {
    return await this.notificationService.getAllNotifications(payload);
  }

  @MessagePattern(LATEST_NOTIFICATIONS)
  async getLatestNotifications(
    @Payload()
    payload: {
      userId: string;
    }
  ): Promise<unknown> {
    return await this.notificationService.getLatestNotifications(payload);
  }

  @MessagePattern(SINGLE_NOTIFICATION)
  async getSingleNotification(
    @Payload() payload: { userId: string; notificationId: string }
  ): Promise<Notification> {
    return await this.notificationService.getSingleNotification(payload);
  }

  @EventPattern(READ_SINGLE_NOTIFICATION)
  async readSingleNotification(payload: {
    userId: string;
    notificationIds?: [string];
  }): Promise<void> {
    await this.notificationService.readNotifications({
      userId: payload.userId,
      notificationIds: payload.notificationIds,
      method: 'single',
    });
  }

  @EventPattern(READ_ALL_NOTIFICATIONS)
  async readAllNotifications(payload: { userId: string }): Promise<void> {
    return await this.notificationService.readNotifications({
      userId: payload.userId,
      method: 'all',
    });
  }

  @MessagePattern(DELETE_NOTIFICATION)
  async deleteSingleNotification(
    @Payload() payload: { userId: string; notificationIds: [string] }
  ): Promise<void> {
    return await this.notificationService.deleteNotifications({
      userId: payload.userId,
      notificationIds: payload.notificationIds,
      method: 'single',
    });
  }

  @MessagePattern(DELETE_ALL_NOTIFICATIONS)
  async deleteAllNotifications(
    @Payload() payload: { userId: string }
  ): Promise<void> {
    return await this.notificationService.deleteNotifications({
      userId: payload.userId,
      method: 'all',
    });
  }

  @MessagePattern(UNREAD_NOTIFICATIONS)
  async unreadNotifications(
    @Payload() payload: { userId: string; notificationIds: [string] }
  ): Promise<void> {
    return await this.notificationService.unreadNotifications({
      userId: payload.userId,
      notificationIds: payload.notificationIds,
      method: 'single',
    });
  }

  @MessagePattern(UNREAD_ALL_NOTIFICATIONS)
  async unreadAllNotifications(
    @Payload() payload: { userId: string }
  ): Promise<void> {
    return await this.notificationService.unreadNotifications({
      userId: payload.userId,
      method: 'all',
    });
  }
}
