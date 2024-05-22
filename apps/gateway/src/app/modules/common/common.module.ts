import { Module } from '@nestjs/common';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthController } from './controllers/auth.controller';
import { UserProfileController } from './controllers/user-profile.controller';
import { WinstonService } from '@shared/config';
import { UtilsController, EventsGateway } from './controllers/utils.controller';

import { ALL_SERVICE_PROVIDERS, SERVICE_PROVIDERS } from './services';
import { SuperAdminController } from './controllers/super-admin.controller';
import { SharedModule } from '@shared';
import { NotificationController } from './controllers/notification.controller';

const schemaObject = {
  // Environment Configuration
  NODE_ENV: Joi.string().allow('development', 'production').required(),

  // Gateway Configuration
  GATEWAY_BASE_URI: Joi.string().required(),
  GATEWAY_PORT: Joi.number().required(),

  // RMQ Configuration
  RMQ_URI: Joi.string().required(),

  // CloudWatch Configuration
  CLOUDWATCH_GROUP_NAME: Joi.string().optional(),
  CLOUDWATCH_STREAM_NAME: Joi.string().optional(),
  CLOUDWATCH_AWS_REGION: Joi.string().optional(),
  CLOUDWATCH_AWS_ACCESS_KEY: Joi.string().optional(),
  CLOUDWATCH_AWS_SECRET_KEY: Joi.string().optional(),
  CLOUDWATCH_LOGS: Joi.boolean().optional(),
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object(schemaObject),
    }),
    ScheduleModule.forRoot(),
    MulterModule.register({
      limits: { fileSize: 5242880 }, // 5 MB
    }),
    WinstonModule.forRootAsync({
      useClass: WinstonService,
    }),
    SharedModule,
  ],
  controllers: [
    AuthController,
    UtilsController,
    UserProfileController,
    SuperAdminController,
    NotificationController,
  ],
  providers: [...SERVICE_PROVIDERS, ALL_SERVICE_PROVIDERS, EventsGateway],
  exports: [...SERVICE_PROVIDERS, EventsGateway],
})
export class CommonModule {}
