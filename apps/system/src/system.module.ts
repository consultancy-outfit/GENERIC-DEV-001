import { Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { SharedModule } from '@shared';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AuditLogRepository,
  BackupRepository,
  ModelsProviders,
} from '@shared/repository';
import { BackupController } from './app/controllers/backup.controller';
import { BackupService } from './app/services/backup.service';
import { SERVICE } from './app/constants';
import { AuditLogController } from './app/controllers/audit-log.controller';
import { AuditLogService } from './app/services/audit-log.service';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from '@shared/filters';

const schemaObject = {
  // RMQ Configuration
  RMQ_URI: Joi.string().required(),
  [`RMQ_${SERVICE}_QUEUE`]: Joi.string().required(),

  // Mongo DB Configuration
  MONGO_DSN: Joi.string().required(),
  MONGO_DATABASE: Joi.string().required(),
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object(schemaObject),
    }),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: `${config.get('MONGO_DSN')}/${config.get('MONGO_DATABASE')}`,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature(ModelsProviders),
    SharedModule,
  ],

  controllers: [BackupController, AuditLogController],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    BackupService,
    BackupRepository,
    AuditLogService,
    AuditLogRepository,
  ],
})
export class SystemModule {}
