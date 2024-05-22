import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { SwaggerService } from '@shared';

@Injectable()
export class AuditLogsInterceptor implements NestInterceptor {
  protected readonly logger = new Logger(AuditLogsInterceptor.name);
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    if (req.url.includes('undefined')) {
      throw new BadRequestException('Invalid Request URL.');
    }
    SwaggerService.setCurrentApiUrl(
      context.getClass().name,
      context.getHandler().name
    );

    return next.handle().pipe(
      map(async (res) => {
        const controllerKey = context.getClass().name;
        const methodKey = context.getHandler().name;
        const eventId = `${controllerKey.replace('Controller', '')}.${
          methodKey.charAt(0).toUpperCase() + methodKey.slice(1)
        }`;
        const events = [];
        if (SwaggerService?._document?.paths == undefined) {
          return res;
        }
        Object.values(SwaggerService._document.paths).forEach((methods) => {
          Object.keys(methods).forEach((method) => {
            events.push({
              eventId: methods[method].operationId,
              description: methods[method]?.description || '',
            });
          });
        });
        const eventDateTime = new Date();
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        ip = ip?.toString().replace('::ffff:', '');
        const _ = {
          userId:
            req.userProfile?.userId || res.data?.user?.userId || 'UNKNOWN',
          name:
            (req.userProfile?.firstName && req.userProfile?.lastName) ||
            res.data?.user
              ? `${req.userProfile?.firstName || res.data?.user?.firstName} ${
                  req.userProfile?.lastName || res.data?.user?.lastName
                }`
              : 'UNKNOWN',
          role:
            req.userProfile?.defaultRole ||
            res?.data?.user?.defaultRole ||
            'UNKNOWN',
          status: 'ACTIVE',
          ipAddress: ip,
          eventName:
            events.find((e) => e.eventId === eventId)?.description ||
            eventId
              .split('.')
              .pop()
              .replace(/([a-z])([A-Z])/g, '$1 $2'),
          eventDate: eventDateTime.toLocaleDateString('en-UK'),
          eventTime: eventDateTime.toLocaleTimeString('en-UK'),
        };
        return res;
      })
    );
  }
}
