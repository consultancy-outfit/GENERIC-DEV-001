import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { SERVICE } from './app/constants';
import { MongooseModule } from '@nestjs/mongoose';
import { UserNotificationService } from './app/services/user-notification.service';
import { Notification, NotificationSchema } from '@shared/schemas';
import { NotificationRepository } from '@shared/repository';
import { NotificationController } from './app/controllers/notification.controller';
import { DatabaseChannel } from './app/channels/database.channel';
import { NestJsNotification } from './app/services/nestjs-notification.service';
import { MailerModule } from '@nestjs-modules/mailer/dist';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { join } from 'path';
import { UserNotificationController } from './app/controllers/user-notifications.controller';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from '@shared/filters';

const schemaObject = {
  // RMQ Configuration
  RMQ_URI: Joi.string().required(),
  [`RMQ_${SERVICE}_QUEUE`]: Joi.string().required(),

  // DB Configuration
  MONGO_DSN: Joi.string().required(),
  MONGO_DATABASE: Joi.string().required(),

  // SMTP Configuration
  SMTP_HOST: Joi.string().required(),
  SMTP_USERNAME: Joi.string().required(),
  SMTP_PASSWORD: Joi.string().required(),
  SMTP_PORT: Joi.number().required(),
  SMTP_SECURE: Joi.boolean().required(),
  SMTP_DEFAULT_NAME: Joi.string().required(),
  SMTP_DEFAULT_EMAIL: Joi.string().required(),
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
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST'),
          secure: true,
          auth: {
            user: config.get('SMTP_USERNAME'),
            pass: config.get('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: `"${config.get('SMTP_DEFAULT_NAME')}" <${config.get(
            'SMTP_DEFAULT_EMAIL'
          )}>`,
        },
        template: {
          dir: join(__dirname, 'assets', 'email-templates'),
          adapter: new EjsAdapter(),
          options: {},
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationController, UserNotificationController],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    UserNotificationService,
    NotificationRepository,
    DatabaseChannel,
    NestJsNotification,
  ],
})
export class NotificationModule {}
