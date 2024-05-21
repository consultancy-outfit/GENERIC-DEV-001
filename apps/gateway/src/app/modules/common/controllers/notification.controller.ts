import {
  Body,
  Controller,
  Get,
  Inject,
  Query,
  Logger,
  Req,
  Patch,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthN, ApiDescription } from '@gateway/decorators';
import { ClientRMQ } from '@nestjs/microservices';
import { MESSAGE_PATTERNS, SERVICES, NoticeTypeEnum } from '@shared/constants';
import { firstValueFrom } from 'rxjs';
import {
  GetLatestUserNotificationsDto,
  GetUserNotificationsDto,
  ReadNotificationsRequest,
} from '../dto/user/user-notification.dto';

const {
  ALL_NOTIFICATIONS,
  DELETE_ALL_NOTIFICATIONS,
  DELETE_NOTIFICATION,
  LATEST_NOTIFICATIONS,
  READ_ALL_NOTIFICATIONS,
  READ_SINGLE_NOTIFICATION,
  UNREAD_NOTIFICATIONS,
  UNREAD_ALL_NOTIFICATIONS,
} = MESSAGE_PATTERNS.NOTIFICATIONS;

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);
  constructor(
    @Inject(SERVICES.NOTIFICATION) private notificationClient: ClientRMQ
  ) {}

  @AuthN()
  @Get()
  @ApiCreatedResponse({
    type: GetUserNotificationsDto,
  })
  @ApiDescription('Get All Notifications')
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'offset',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'startDate',
    type: Date,
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    type: Date,
    required: false,
  })
  @ApiQuery({
    name: 'search',
    type: String,
    required: false,
  })
  @ApiQuery({
    name: 'noticeType',
    type: String,
    enum: NoticeTypeEnum,
    example: NoticeTypeEnum.SYSTEM_NOTICE,
    required: false,
  })
  async getAllNotifications(
    @Req() { user: { userId } },
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('search') search?: string,
    @Query('noticeType') noticeType?: NoticeTypeEnum
  ) {
    const data = await firstValueFrom(
      this.notificationClient.send(ALL_NOTIFICATIONS, {
        userId,
        offset,
        limit,
        startDate,
        endDate,
        noticeType,
        search,
      })
    );
    return {
      errors: null,
      data: data,
      message: 'All Notifications',
    };
  }

  @AuthN()
  @Get('latest')
  @ApiCreatedResponse({
    type: GetLatestUserNotificationsDto,
  })
  @ApiDescription('Get Latest Notifications')
  async getLatestNotifications(@Req() { user: { userId } }) {
    const data = await firstValueFrom(
      this.notificationClient.send(LATEST_NOTIFICATIONS, { userId })
    );
    return {
      data: data,
      message: 'Latest Notifications',
      errors: null,
    };
  }

  @AuthN()
  @Patch('read')
  @ApiDescription('Mark All Notifications as read')
  async markSingleAsReadNotification(
    @Req() { user: { userId } },
    @Body() dto: ReadNotificationsRequest
  ) {
    await firstValueFrom(
      this.notificationClient.emit(READ_SINGLE_NOTIFICATION, {
        userId,
        notificationIds: dto.notificationIds,
      })
    );
    return {
      data: null,
      message: 'Notification(s) have been marked as read',
      errors: null,
    };
  }

  @AuthN()
  @Patch('read/all')
  @ApiDescription('Mark All Notifications as read')
  async markAllAsReadNotifications(@Req() { user: { userId } }) {
    await firstValueFrom(
      this.notificationClient.emit(READ_ALL_NOTIFICATIONS, { userId })
    );
    return {
      data: null,
      message: 'All Notifications have been marked as read',
      errors: null,
    };
  }

  @AuthN()
  @Patch('unread')
  @ApiDescription('Unread Notification(s)')
  async unreadNotification(
    @Req() { user: { userId } },
    @Body() dto: ReadNotificationsRequest
  ) {
    await firstValueFrom(
      this.notificationClient.emit(UNREAD_NOTIFICATIONS, {
        userId,
        notificationIds: dto.notificationIds,
      })
    );
    return {
      errors: null,
      data: null,
      message: 'Notification(s) have been marked as unread',
    };
  }

  @AuthN()
  @Patch('unread/all')
  @ApiDescription('Unread All Notifications')
  async unreadAllNotification(@Req() { user: { userId } }) {
    await firstValueFrom(
      this.notificationClient.emit(UNREAD_ALL_NOTIFICATIONS, { userId })
    );
    return {
      errors: null,
      data: null,
      message: 'All Notifications have been marked as unread',
    };
  }

  @AuthN()
  @Patch('delete')
  @ApiDescription('Delete Notification(s)')
  async deleteNotification(
    @Req() { user: { userId } },
    @Body() dto: ReadNotificationsRequest
  ) {
    await firstValueFrom(
      this.notificationClient.emit(DELETE_NOTIFICATION, {
        userId,
        notificationIds: dto.notificationIds,
      })
    );
    return {
      data: null,
      message: 'Notification(s) have been deleted',
      errors: null,
    };
  }

  @AuthN()
  @Patch('delete/all')
  @ApiDescription('Delete All Notifications')
  async deleteAllNotification(@Req() { user: { userId } }) {
    await firstValueFrom(
      this.notificationClient.emit(DELETE_ALL_NOTIFICATIONS, { userId })
    );
    return {
      errors: null,
      data: null,
      message: 'All Notifications have been deleted',
    };
  }
}
