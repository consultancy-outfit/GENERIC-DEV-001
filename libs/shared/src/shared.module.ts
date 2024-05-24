import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CommonService } from './services/common.service';
import Joi from 'joi';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3 } from '@aws-sdk/client-s3';
import { SERVICES } from './constants';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ScheduleModule } from '@nestjs/schedule';
import { S3Service } from './services';

const schemaObject = {
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
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 3,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        paramsSerializer: (params) => new URLSearchParams(params).toString(),
      }),
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [
    CommonService,
    {
      provide: SERVICES.NOTIFICATION,
      useFactory: (config: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RMQ_URI')],
            queue: config.get(`RMQ_${SERVICES.NOTIFICATION}_QUEUE`),
            prefetchCount: 1,
            queueOptions: {
              durable: false,
            },
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'S3',
      useFactory: (config: ConfigService) =>
        new S3({
          region: config.get('S3_REGION'),
          credentials: {
            accessKeyId: config.get('S3_AWS_ACCESS_KEY'),
            secretAccessKey: config.get('S3_AWS_SECRET_KEY'),
          },
        }),
      inject: [ConfigService],
    },
    S3Service,
    SchedulerRegistry,
  ],
  exports: [CommonService, S3Service, HttpModule],
})
export class SharedModule {}
