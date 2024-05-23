import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthNGuard, AuthZGuard } from './app/guards';
import { ExceptionsFilter } from './app/filters';
import { LoggerMiddleware, RouterMiddleware } from './app/middleware';
import { ConfigService } from '@nestjs/config';
import { AuditLogsInterceptor } from './app/interceptors/audit-logs.interceptor';
import { ResponseInterceptor } from './app/interceptors';
import { CommonModule } from './app/modules/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [].sort(),
  providers: [
    { provide: APP_GUARD, useClass: AuthNGuard },
    { provide: APP_GUARD, useClass: AuthZGuard },
    { provide: APP_FILTER, useClass: ExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditLogsInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class GatewayModule implements NestModule {
  constructor(private config: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    if (
      this.config.get('NODE_ENV') != 'production' &&
      this.config.get('CLOUDWATCH_LOGS') == 'true'
    ) {
      consumer.apply(LoggerMiddleware).forRoutes('*');
    }
    consumer
      .apply(RouterMiddleware)
      .exclude('(health-check|utils)(.*)')
      .forRoutes('*');
  }
}
