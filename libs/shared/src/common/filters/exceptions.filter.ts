import { Catch, HttpException, RpcExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class GlobalExceptionFilter implements RpcExceptionFilter {
  catch(error: Error): Observable<any> {
    if (error instanceof HttpException) {
      return throwError(() => error);
    }
    return throwError(
      () => new RpcException(error?.message?.length ? error?.message : error)
    );
  }
}
