import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 } from 'uuid';
import { EventsGateway } from '../modules/common/controllers/utils.controller';
import { SOCKET_ROOM } from '@shared/constants';

@Injectable()
export class RouterMiddleware implements NestMiddleware {
  private readonly logger = new Logger();

  notIncludeRoutes = ['/favicon.ico'];
  notIncludeStatus = [];

  constructor(private readonly gateway: EventsGateway) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, headers, body, query, originalUrl } = req;
    const rawResponse = res.write;
    const rawResponseEnd = res.end;
    const chunkBuffers = [];
    res.write = (...chunks) => {
      const resArgs = [];
      for (let i = 0; i < chunks.length; i++) {
        resArgs[i] = chunks[i];
        if (!resArgs[i]) {
          res.once('drain', res.write);
          i--;
        }
      }
      if (resArgs[0]) {
        chunkBuffers.push(Buffer.from(resArgs[0]));
      }
      return rawResponse.apply(res, resArgs);
    };

    res.end = (...chunk) => {
      const resArgs = [];
      for (let i = 0; i < chunk.length; i++) {
        resArgs[i] = chunk[i];
      }
      if (resArgs[0]) {
        chunkBuffers.push(Buffer.from(resArgs[0]));
      }
      return rawResponseEnd.apply(res, resArgs);
    };

    res.on('finish', () => {
      const { statusCode } = res;
      const responseBody = Buffer.concat(chunkBuffers).toString('utf8');
      const logLevel = statusCode >= 200 && statusCode < 300 ? 'log' : 'error';
      const spacing = Array(6 - method.length).fill('>');
      spacing.length && (spacing[spacing.length - 1] = ' ');
      this.logger[logLevel](
        `${spacing.join('')}(${statusCode}) ${originalUrl}`,
        method.toUpperCase()
      );
      try {
        if (
          !this.notIncludeRoutes?.includes(originalUrl) &&
          !this.notIncludeStatus?.includes(statusCode)
        ) {
          const request = {
            reqId: v4(),
            level: logLevel == 'log' ? 'INFO' : 'ERROR',
            method: method.toUpperCase(),
            url: originalUrl,
            statusCode: statusCode,
            reqHeaders: JSON.stringify(
              {
                'Content-Type': headers['Content-Type'] ?? 'application/json',
                ...(headers['authorization'] && {
                  Authorization: headers['authorization']?.slice(0, 15) + '...',
                }),
                developerName: headers['developer-name'] ?? 'Unknown',
              },
              null,
              2
            ),
            pathParams: JSON.stringify(req.params ?? {}, null, 2),
            queryParams: JSON.stringify(query ?? {}, null, 2),
            reqBody: JSON.stringify(body ?? {}, null, 2),
            resBody:
              res.getHeader('Content-Type') == 'application/json'
                ? JSON.stringify(JSON.parse(responseBody ?? '{}'), null, 2)
                : null,
            timestamp: new Date().toLocaleString('en-UK', {
              timeZone: 'Asia/Karachi',
              hour12: true,
            }),
          };
          this.gateway.server?.to(SOCKET_ROOM).emit('request', request);
          this.gateway.addRequest(request);
        }
      } catch (err) {
        this.logger.error(err);
      }
    });

    next();
  }
}
