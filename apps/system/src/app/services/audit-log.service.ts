import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { AuditLogRepository } from '@shared/repository';
import { AuditLogListDto } from '../dto/audit-log.dto';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);
  constructor(private auditLogRepository: AuditLogRepository) {}

  async createAuditLog(payload): Promise<void> {
    await this.auditLogRepository.create(payload);
  }

  async getAuditLogsList(payload: AuditLogListDto) {
    try {
      const { limit, offset, search, accountType } = payload;
      const pipelines = [
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $match: {
            ...(search && {
              $or: [
                { 'user.firstName': { $regex: new RegExp(search, 'i') } },
                { 'user.lastName': { $regex: new RegExp(search, 'i') } },
              ],
            }),
            ...(accountType && { 'user.defaultRole': accountType }),
          },
        },
        // {
        //   $project: {
        //     _id: 1,
        //     userId: 1,
        //     ipAddress: 1,
        //     eventName: 1,
        //     'user.firstName': 1,
        //     'user.lastName': 1,
        //     'user.profileImage': 1,
        //     'user.defaultRole': 1,
        //     createdAt: 1,
        //   },
        // },
      ];

      return await this.auditLogRepository.paginate({
        pipelines,
        limit,
        offset,
        returnKey: 'auditLogs',
      });
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async getRecentAuditTrail() {
    try {
      const result = await this.auditLogRepository.getRecentAuditTrail();

      // Extract the results from the facet output
      const { todayResult, yesterdayResult } = result[0];

      return { todayResult, yesterdayResult };
    } catch (err) {
      throw new RpcException(err);
    }
  }
}
