import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { SERVICE } from './app/constants';
import { UserAccountProfileModule } from './user-account-profile.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(UserAccountProfileModule, {
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
