import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { SystemModule } from './system.module';
import { SERVICE } from './app/constants';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(SystemModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RMQ_URI],
      queue: process.env[`RMQ_${SERVICE}_QUEUE`],
      queueOptions: {
        durable: false,
      },
    },
  });
  await app.listen();
}
bootstrap();
