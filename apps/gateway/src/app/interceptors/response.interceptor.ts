import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { Observable, map } from 'rxjs';
import { SwaggerService } from '@shared';
import { FileContentTypes } from '@shared/constants';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private excludedBaseRoutes = ['health-check'];
  constructor(private reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>
  ): Observable<any> | Promise<Observable<any>> {
    const defaultHttpCode = this.reflector.get(
      HTTP_CODE_METADATA,
      context.getHandler()
    );
    const response: Response = context.switchToHttp().getResponse();
    const request = context.switchToHttp().getRequest();

    if (this.shouldExcludeRoute(request)) {
      return next.handle();
    }

    this.checkNullOrUndefined(request.url);

    const HttpStatus = {
      GET: 200,
      POST: 201,
      PUT: 202,
      PATCH: 202,
      DELETE: 200,
    };

    return next.handle().pipe(
      map((data) => {
        this.handleResponseStatusCode(
          response,
          request,
          defaultHttpCode,
          HttpStatus
        );

        const message = SwaggerService.getMessage(
          context.getClass().name,
          context.getHandler().name
        );

        if (request.loggedInBy) {
          response.setHeader('login-session-by', request.loggedInBy);
        }

        if (this.shouldSendNonJsonResponse(response)) {
          response.send(data);
        } else {
          return this.buildJsonResponse(
            !this.isDeleteMethod(request) ? data : null,
            message
          );
        }
      })
    );
  }

  private shouldExcludeRoute(request: Request): boolean {
    return this.excludedBaseRoutes.some((base) => request.url?.includes(base));
  }

  private checkNullOrUndefined(url: string) {
    if (url?.includes('null') || url?.includes('undefined')) {
      throw new BadRequestException('Invalid Request URL.');
    }
  }

  private handleResponseStatusCode(
    response: Response,
    request: Request,
    defaultHttpCode: number,
    HttpStatus: any
  ) {
    if (!defaultHttpCode) {
      response.status(
        response?.statusCode > 300
          ? response.statusCode
          : HttpStatus[request.method.toUpperCase()]
      );
    }
  }

  private shouldSendNonJsonResponse(response: Response): boolean {
    return (
      response.getHeader('Content-Type') &&
      response.getHeader('Content-Type') !== FileContentTypes.JSON
    );
  }

  private buildJsonResponse(data: any, message?: string): any {
    return {
      data: data?.data ?? data ?? null,
      message: data?.message ?? message ?? 'Success',
      errors: data?.errors ?? null,
    };
  }

  private isDeleteMethod(request: any): boolean {
    return request.method.toUpperCase() === 'DELETE';
  }
}
