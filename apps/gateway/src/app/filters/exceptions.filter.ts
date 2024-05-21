import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { EXCEPTION_MESSAGES } from '../exceptions/exception-messages';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger();

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exceptionData: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    if (request.loggedInBy) {
      response.setHeader('login-session-by', request.loggedInBy);
    }

    try {
      const exception = {
        message:
          typeof exceptionData?.message == 'string'
            ? exceptionData?.message
            : exceptionData || 'Pipeline Failed',
        ...(typeof exceptionData == 'object' && exceptionData),
      };

      const httpStatus: number = this.getStatusCode(exception);

      const message: string | null = this.getMessage(exception) || null;

      const errors: string[] = this.getErrors(exception, message);

      const responseBody = {
        data: null,
        message,
        errors,
      };

      this.logOnError(exception, httpStatus, message);
      if (httpStatus == 400 && errors?.length > 1) {
        errors?.forEach((_err) => {
          this.logger.error(_err);
        });
      }
      httpAdapter.reply(response, responseBody, httpStatus);
    } catch (err) {
      this.logger.error(exceptionData);
      this.logger.error(err);
      httpAdapter.reply(
        response,
        {
          data: null,
          message: 'Contact Dianujnima.',
          errors: err.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private getStatusCode(exception: any) {
    if (!exception.name && !exception.message && !exception.getStatus()) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }
    switch (true) {
      case exception instanceof HttpException:
        return exception.getStatus();
      case !!exception?.error?.statusCode:
        return exception?.error?.statusCode;
      case !!exception?.['$metadata']?.httpStatusCode:
        return exception['$metadata']?.httpStatusCode;
      case Boolean(
        (typeof exception?.message == 'string'
          ? exception?.message
          : exception?.name
        )?.match(/(NotAuthorized|Unauthorized)/i)
      ):
        return HttpStatus.UNAUTHORIZED;
      case Boolean(
        (typeof exception?.message == 'string'
          ? exception?.message
          : exception?.name
        )?.match(/(notfound|found)/i)
      ):
        return HttpStatus.NOT_FOUND;
      case Boolean(
        (typeof exception?.message == 'string'
          ? exception?.message
          : exception?.name
        )?.match(/(invalid|must|should)/i)
      ):
        return HttpStatus.BAD_REQUEST;
      case Boolean(
        (typeof exception?.message == 'string'
          ? exception?.message
          : exception?.name
        )?.match(/(already|exists)/i)
      ):
        return HttpStatus.CONFLICT;
      case Boolean(
        (typeof exception?.message == 'string'
          ? exception?.message
          : exception?.name
        )?.match(/(token|revoked)/i)
      ):
        return HttpStatus.UNAUTHORIZED;
      default:
        return (
          exception?.error?.statusCode ||
          exception?.statusCode ||
          (typeof exception?.status == 'number' && exception?.status) ||
          exception?.error?.name ||
          HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
  }

  private getMessage(exception: any) {
    if (exception?.message && Object.keys(exception?.message).length === 0) {
      return 'Internal Server Error';
    }

    if (
      exception.message.hasOwnProperty('original') &&
      exception.message?.original?.hasOwnProperty('text')
    ) {
      return exception.message.original.text;
    }
    switch (true) {
      case Array.isArray(exception?.response?.message):
        return exception?.response?.message[0];
      case Object.keys(EXCEPTION_MESSAGES).includes(exception?.name):
        return EXCEPTION_MESSAGES[exception?.name];
      case !!exception['$fault']:
      case exception?.message?.includes('eu-west-2'):
        return 'Internal Server Error';
      case exception?.message?.includes(' JSON '):
        return 'Invalid Request Body';
      default:
        return exception.message
          ?.replace(/group/i, 'Role')
          .replace('Password did not conform with policy: ', '');
    }
  }

  private getErrors(exception: any, message: string | null) {
    if (
      !exception.hasOwnProperty('errors') &&
      exception.message.hasOwnProperty('original') &&
      exception.message?.original?.hasOwnProperty('text')
    ) {
      return exception.message.original.text;
    }
    switch (true) {
      case Array.isArray(exception.errors):
        return exception.errors;
      case typeof exception.errors == 'object':
        return Object.values(exception.errors);
      case Array.isArray(exception?.response?.errors):
        return exception?.response?.errors;
      case Array.isArray(exception?.response?.message):
        return exception?.response?.message;
      default:
        return message ? [message] : [];
    }
  }

  private logOnError(exception: any, httpStatus: number, message?: string) {
    const noLogStatus = [403];
    const noLogMessages = ['Token expired.', 'Refresh Token has been revoked'];
    const titles = {
      401: 'Unauthorized',
      400: 'BadRequest',
      409: 'AlreadyExists',
      500: 'ServerFailure',
    };

    const exceptionTitle =
      exception?.name?.replace('NotAuthorized', 'Unauthorized') ||
      (typeof exception?.name == 'string' &&
        exception?.name?.replace('NotAuthorized', 'Unauthorized')) ||
      titles[httpStatus || 500];

    if (!noLogStatus.includes(httpStatus) && !noLogMessages.includes(message)) {
      this.logger.error(
        message?.charAt(0).toUpperCase() + message?.slice(1),
        exceptionTitle?.replace('Exception', '')
      );

      exception?.stack &&
        this.logger.error(
          '    at ' +
            exception?.stack?.split('    at ')?.slice(1).join('    at ')
        );
    }
  }
}
