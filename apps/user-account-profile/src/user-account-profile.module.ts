import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthService } from './app/services/auth.service';
import { SERVICE } from './app/constants';
import { AuthController } from './app/controllers/auth.controller';
import { TokenService } from './app/services/token.service';
import { AuditLogRepository, UserRepository } from '@shared/repository';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedModule } from '@shared';
import { TokenController } from './app/controllers/token.controller';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from '@shared/filters';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuditLog, AuditLogSchema, User, UserSchema } from '@shared/schemas';
import { UserService } from './app/services/user.service';
import { UserController } from './app/controllers/user.controller';

const schemaObject = {
  // RMQ Configuration
  RMQ_URI: Joi.string().required(),
  [`RMQ_${SERVICE}_QUEUE`]: Joi.string().required(),

  // Mongo DB Configuration
  MONGO_DSN: Joi.string().required(),
  MONGO_DATABASE: Joi.string().required(),

  // Cognito Configuration
  COGNITO_USER_POOL_ID: Joi.string().required(),
  COGNITO_CLIENT_ID: Joi.string().required(),
  COGNITO_CLIENT_SECRET: Joi.string().required(),
  COGNITO_REGION: Joi.string().required(),
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
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: AuditLog.name,
        schema: AuditLogSchema,
      },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
    SharedModule,
  ],
  controllers: [AuthController, TokenController, UserController],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    UserService,
    AuthService,
    TokenService,
    AuditLogRepository,
    UserRepository,
  ],
})
export class UserAccountProfileModule {}
