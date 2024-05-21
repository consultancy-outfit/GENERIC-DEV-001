import { NestFactory } from '@nestjs/core';
import { DocumentBuilder } from '@nestjs/swagger';
import { GatewayModule } from './gateway.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ConfigService } from '@nestjs/config';
import { urlencoded, json, Response, Request } from 'express';
import expressBasicAuth from 'express-basic-auth';
import { join } from 'path';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { SwaggerService } from '@shared';
import { COMPANIES } from '@shared/constants';
import { exitHandler, toCapitalizeFirst, toTitleCase } from '@shared/utils';
import { CommonModule } from './app/modules/common/common.module';
import { OnboardingModule } from './app/modules/onboarding/onboarding.module';
import { RecruitmentModule } from './app/modules/recruitment/recruitment.module';
import { PerformanceModule } from './app/modules/performance/performance.module';
import { writeFileSync } from 'fs';

const extractErrorMessages = (
  error: ValidationError,
  parent?: ValidationError
) => {
  let messages = [];
  if (error.constraints) {
    messages = Object.values(error.constraints).map((err) =>
      toCapitalizeFirst(
        err
          .replace(
            new RegExp(error.property, 'g'),
            toTitleCase(error.property) +
              (parent ? ` (in ${toTitleCase(parent.property)})` : '')
          )
          .replace(/No /g, 'Number ')
          .replace(/a string/g, 'text')
          .replace(/should not be empty/g, 'is required')
          .replace(
            /.*must be a mongodb id/g,
            `Select a valid ${toTitleCase(error.property.replace(/id/i, ''))}`
          )
      )
    );
  }
  if (error.children) {
    error.children.forEach((childError) => {
      messages = [...messages, ...extractErrorMessages(childError, error)];
    });
  }
  return messages;
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(GatewayModule);
  const config = app.get<ConfigService>(ConfigService);

  /* CORS Configuration */
  app.enableCors({
    origin: '*',
  });

  /* Removed Express Powered By */
  app.disable('x-powered-by');

  /* Removed 304 Redirects */
  app.disable('etag');

  /* Increased JSON Body Size */
  app.use(json({ limit: '50mb' }));

  /* Increased Form Data Size */
  app.use(urlencoded({ limit: '50mb', extended: true }));

  /* Health Check Redirect */
  app.getHttpAdapter().get('/', (req: Request, res: Response) => {
    return res.redirect('/health-check/view');
  });

  /* Added HTML Renderer Engine & Configurations */
  app.setViewEngine('ejs');
  app.useStaticAssets(join(__dirname, 'assets', 'public'));
  app.setBaseViewsDir(join(__dirname, 'assets', 'views'));

  /* Swagger UI Generation Configuration */
  const documentConfig = new DocumentBuilder()
    .setTitle(
      `Personnel Library (<COMPANY>) - API Gateway (${toTitleCase(
        config.get('NODE_ENV') || 'development'
      )})`
    )
    .setDescription(
      'PL API Gateway is open for development and testing purposes for FE developers.'
    )
    .addBearerAuth()
    .setVersion('1.0.0')
    .build();

  // ONBOARDING
  new SwaggerService(
    '/api/onboarding',
    app,
    documentConfig,
    COMPANIES.ONBOARDING,
    {
      include: [CommonModule, OnboardingModule],
    }
  ).init();

  // RECRUITMENT
  new SwaggerService(
    '/api/recruitment',
    app,
    documentConfig,
    COMPANIES.RECRUITMENT,
    {
      include: [CommonModule, RecruitmentModule],
    }
  ).init();

  // PERFORMANCE
  new SwaggerService(
    '/api/performance',
    app,
    documentConfig,
    COMPANIES.PERFORMANCE,
    {
      include: [CommonModule, PerformanceModule],
    }
  ).init();

  writeFileSync(
    join(__dirname, 'spec.json'),
    JSON.stringify({ ...SwaggerService._document, servers: [{ url: '' }] })
  );

  app.use(
    ['/api/*'],
    expressBasicAuth({
      challenge: true,
      users: {
        pl: 'pl123!@#',
      },
    })
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        let errors: null | string[] = null;
        validationErrors.forEach((error) => {
          const errMessages = extractErrorMessages(error);
          if (errMessages.length) {
            errors = !errors?.length
              ? [...errMessages]
              : [...errors, ...errMessages];
          }
        });
        return new BadRequestException(errors);
      },
    })
  );

  /* Logger Configuration */
  if (
    config.get('NODE_ENV') == 'production' &&
    config.get('CLOUDWATCH_LOGS') == 'true'
  ) {
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  }

  await app.listen(config.get('GATEWAY_PORT'));

  const serverHandle = exitHandler(app.getHttpServer());

  process.on('uncaughtException', serverHandle(1, 'Unexpected Error'));
  process.on('unhandledRejection', serverHandle(1, 'Unhandled Promise'));
  process.on('SIGTERM', serverHandle(0, 'SIGTERM'));
  process.on('SIGINT', serverHandle(0, 'SIGINT'));
}
bootstrap();
