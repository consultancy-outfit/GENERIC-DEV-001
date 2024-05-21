import { Controller, Get, Inject, Logger, Query, Render } from '@nestjs/common';
import { ClientRMQ } from '@nestjs/microservices';
import { ApiExcludeController } from '@nestjs/swagger';
import { firstValueFrom, timeout } from 'rxjs';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SERVICES, SOCKET_ROOM } from '@shared/constants';
import { generateEndpoints } from '@rtk-query/codegen-openapi';
import { OperationDefinition } from '@rtk-query/codegen-openapi/lib/types';
import { join } from 'path';

@ApiExcludeController()
@Controller()
export class UtilsController {
  protected readonly logger = new Logger();
  constructor(
    @Inject('MICRO_SERVICES') private readonly svcClients: ClientRMQ[]
  ) {}

  /* ---------------------- Health Check -------------------------- */

  @Get('health-check')
  async check() {
    try {
      const services = {};
      const checkTimeout = 1500; // Milliseconds
      await Promise.all(
        Object.keys(SERVICES).map(async (svc, i) => {
          try {
            services[svc] = await firstValueFrom(
              this.svcClients[i]
                .send('health-check', {})
                .pipe(timeout(checkTimeout))
            );
          } catch (err) {
            services[svc] = { healthCheckPassed: false, healthCheck: 'Failed' };
            this.logger.error(
              `[Health Alert] ${svc
                .toLowerCase()
                .replace(/_/g, ' ')
                .replace(/(?: |\b)(\w)/g, function (key, _p1) {
                  return key.toUpperCase();
                })} Microservice Failure\nReason: ${err?.message}`
            );
          }
        })
      );

      return Object.keys(services)
        .sort(
          (a, b) =>
            Object.keys(SERVICES).indexOf(a) - Object.keys(SERVICES).indexOf(b)
        )
        .map((svc) => ({
          name: `${svc
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/(?: |\b)(\w)/g, function (key, _p1) {
              return key.toUpperCase();
            })} Microservice`,
          ...services[svc],
        }));
    } catch (err) {
      this.logger.error(err);
    }
  }

  @Get('health-check/view')
  @Render('health_check')
  async healthCheckView() {
    return { data: await this.check() };
  }

  /* ---------------------- Live Logs ------------------------ */
  @Get('logs')
  @Render('log_view')
  async logView() {
    return {
      room: SOCKET_ROOM,
    };
  }

  /* ---------------------- RTK Query ------------------------ */
  @Get('utils/generate-rtk')
  async generateRtk(@Query('tag') checkTag: string) {
    try {
      const config: any = {
        schemaFile: join(__dirname, 'spec.json'),
        apiFile: '@services/base-api.ts',
        apiImport: 'baseAPI',
        exportName: 'api',
        filterEndpoints: (_, opDef: OperationDefinition) => {
          return opDef.operation.tags.includes(checkTag);
        },
        argSuffix: 'Payload',
        responseSuffix: 'Response',
        hooks: {
          queries: true,
          lazyQueries: true,
          mutations: true,
        },
        tag: true,
        useEnumType: true,
      };

      let generated = await generateEndpoints(config);
      generated = (<string>generated)
        .replace(';', ';\n')
        .replace(/= (void|unknown);/g, '= any;')
        .replace(/export type (.*) = \{/g, 'export interface $1 {');
      return generated;
    } catch (err) {
      this.logger.log(err);
    }
  }
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  private _requests: any[] = [];

  @WebSocketServer()
  server: Server;

  joinRoom(socket: Socket, _data) {
    socket.join(SOCKET_ROOM);
    return { event: 'fetch', data: this._requests };
  }

  public addRequest(request: any) {
    this._requests.push(request);
  }
}
