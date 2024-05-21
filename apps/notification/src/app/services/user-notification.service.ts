import { BadRequestException, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { NotificationRepository } from '@shared/repository';
import { Notification } from '@shared/schemas';
import { FilterQuery } from 'mongoose';
import { NoticeTypeEnum } from '@shared/constants';
@Injectable()
export class UserNotificationService {
  constructor(private notificationRepository: NotificationRepository) {}

  async getAllNotifications(payload: {
    userId: string;
    offset: number;
    limit: number;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    noticeType?: NoticeTypeEnum;
  }) {
    try {
      const { userId, offset, limit, search, noticeType, startDate, endDate } =
        payload;
      const filterQuery: FilterQuery<Notification> = {
        $or: [{ userId }, { userIds: userId }],
      };
      if (search && search.trim().length > 0) {
        filterQuery.$and = [
          {
            $or: [
              {
                title: {
                  $regex: search?.toLowerCase(),
                  $options: 'i',
                },
              },
              {
                message: {
                  $regex: search?.toLowerCase(),
                  $options: 'i',
                },
              },
            ],
          },
        ];
      }
      if (noticeType) {
        filterQuery.type = noticeType;
      }
      if (startDate && endDate) {
        filterQuery.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }
      if (startDate) {
        filterQuery.createdAt = {
          $gte: new Date(startDate),
        };
      }
      if (endDate) {
        filterQuery.createdAt = {
          $lte: new Date(endDate),
        };
      }
      return await this.notificationRepository.paginate({
        filterQuery,
        offset,
        limit,
        returnKey: 'notifications',
        pipelines: [
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
              pipeline: [
                {
                  $project: {
                    email: 1,
                    firstName: 1,
                    lastName: 1,
                    companyId: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: {
              path: '$user',
            },
          },
        ],
      });
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async getLatestNotifications(payload: { userId: string }) {
    try {
      const { userId } = payload;
      const filterQuery = { $or: [{ userId }, { userIds: userId }] };
      const { notifications } = await this.notificationRepository.paginate({
        filterQuery,
        sort: { createdAt: -1 },
        pipelines: [
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
              pipeline: [
                {
                  $project: {
                    email: 1,
                    firstName: 1,
                    lastName: 1,
                    companyId: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: {
              path: '$user',
            },
          },
          {
            $project: {
              readAt: 0,
              updatedAt: 0,
            },
          },
        ],
        offset: 0,
        limit: 4,
        returnKey: 'notifications',
      });
      return notifications;
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async getSingleNotification(payload: {
    userId: string;
    notificationId: string;
  }) {
    try {
      const { userId, notificationId } = payload;
      return await this.notificationRepository.findOne({
        $or: [{ userId }, { userIds: userId }],
        _id: notificationId,
      });
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async readNotifications(payload: {
    userId: string;
    method: string;
    notificationIds?: [string];
  }) {
    try {
      const { userId, method, notificationIds } = payload;
      let query: FilterQuery<Notification>;
      switch (method) {
        case 'single':
          query = {
            $or: [{ userId }, { userIds: userId }],
            _id: { $in: notificationIds },
          };
          break;
        case 'all':
          query = { $or: [{ userId }, { userIds: userId }], readAt: null };
          break;

        default:
          throw new BadRequestException(
            `Request does not make sense method provided ${method} and notification id = ${notificationIds}`
          );
      }
      await this.notificationRepository.updateMany(
        { ...query },
        { readAt: new Date().toISOString() }
      );
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async deleteNotifications(payload: {
    userId: string;
    method: string;
    notificationIds?: [string];
  }) {
    try {
      const { userId, method, notificationIds } = payload;
      let query: FilterQuery<Notification>;

      switch (method) {
        case 'single':
          query = {
            $or: [{ userId }, { userIds: userId }],
            _id: { $in: notificationIds },
          };
          break;
        case 'all':
          query = { $or: [{ userId }, { userIds: userId }] };
          break;

        default:
          throw new BadRequestException(
            `Request does not make sense method provided ${method} and notification id = ${notificationIds}`
          );
      }
      await this.notificationRepository.deleteMany(query);
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async unreadNotifications(payload: {
    userId: string;
    method: string;
    notificationIds?: [string];
  }) {
    try {
      const { userId, method, notificationIds } = payload;
      let query: FilterQuery<Notification>;
      switch (method) {
        case 'single':
          query = {
            $or: [{ userId }, { userIds: userId }],
            _id: { $in: notificationIds },
          };
          break;
        case 'all':
          query = {
            $or: [{ userId }, { userIds: userId }],
            readAt: { $ne: null },
          };
          break;

        default:
          throw new BadRequestException(
            `Request does not make sense method provided ${method} and notification id = ${notificationIds}`
          );
      }
      await this.notificationRepository.updateMany(
        { ...query },
        { readAt: null }
      );
    } catch (err) {
      throw new RpcException(err);
    }
  }
}
