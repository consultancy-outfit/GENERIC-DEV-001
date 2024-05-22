import { ConfigService } from '@nestjs/config';
import {
  ClientProxyFactory,
  ClientRMQ,
  Transport,
} from '@nestjs/microservices';
import { SERVICES } from '@shared/constants';

export const MICRO_SERVICES = Object.values(SERVICES);

export const SERVICE_PROVIDERS = MICRO_SERVICES.map((SERVICE_NAME) => {
  return {
    provide: SERVICE_NAME,
    useFactory: (config: ConfigService) => {
      return ClientProxyFactory.create({
        transport: Transport.RMQ,
        options: {
          urls: [config.get<string>('RMQ_URI')],
          queue: config.get(`RMQ_${SERVICE_NAME}_QUEUE`),
          prefetchCount: 1,
          queueOptions: {
            durable: false,
          },
        },
      });
    },
    inject: [ConfigService],
  };
});

export const ALL_SERVICE_PROVIDERS = {
  provide: 'MICRO_SERVICES',
  useFactory: (...svcClients: ClientRMQ[]) => svcClients,
  inject: MICRO_SERVICES,
};
