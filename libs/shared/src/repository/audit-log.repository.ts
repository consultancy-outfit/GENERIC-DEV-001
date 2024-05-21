import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { AuditLog } from '../schemas/audit-log.schema';
import { AbstractRepository } from '../common/abstracts/repository/abstract.repository';

@Injectable()
export class AuditLogRepository extends AbstractRepository<AuditLog> {
  protected readonly logger = new Logger(AuditLogRepository.name);

  constructor(
    @InjectModel(AuditLog.name) auditLogModel: Model<AuditLog>,
    @InjectConnection() connection: Connection
  ) {
    super(auditLogModel, connection);
  }
  public async getRecentAuditTrail() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const pipeline: any = [
      {
        $addFields: {
          eventDate: {
            $dateFromString: {
              dateString: '$eventDate',
              format: '%d/%m/%Y',
              timezone: 'UTC', // Specify the time zone
            },
          },
        },
      },
      {
        $facet: {
          todayResult: [
            {
              $match: {
                $expr: {
                  $eq: ['$eventDate', today],
                },
              },
            },
            {
              $project: {
                trialMgs: {
                  $concat: ['$name', ' ', '$eventName', ' Successfully'],
                },
                eventTime: 1,
              },
            },
            { $sort: { eventDate: -1, eventTime: -1 } },
            { $limit: 3 },
          ],
          yesterdayResult: [
            {
              $match: {
                $expr: {
                  $eq: ['$eventDate', yesterday],
                },
              },
            },
            {
              $project: {
                trialMgs: {
                  $concat: ['$name', ' ', '$eventName', ' Successfully'],
                },
                eventTime: 1,
              },
            },
            { $sort: { eventDate: -1, eventTime: -1 } },
            { $limit: 3 },
          ],
        },
      },
    ];
    return await this.aggregate(pipeline);
  }
}
