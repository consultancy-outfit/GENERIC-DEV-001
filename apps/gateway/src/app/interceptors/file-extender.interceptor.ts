import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import _ from 'lodash';
import { Observable } from 'rxjs';
@Injectable()
export class FileExtender implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isExtended = this.reflector.get<boolean>(
      'isExtended',
      context.getHandler()
    );
    if (!isExtended) return next.handle();

    const req = context.switchToHttp().getRequest();
    if (!req.headers['content-type']?.includes('multipart/form-data')) {
      throw new BadRequestException('Invalid Content Type.');
    }

    const isRequired = this.reflector.get<boolean>(
      'isRequired',
      context.getHandler()
    );

    const isSingle = this.reflector.get<boolean>(
      'isSingle',
      context.getHandler()
    );

    const _isMultiple = this.reflector.get<boolean>(
      'isMultiple',
      context.getHandler()
    );

    const fieldName = this.reflector.get<string>(
      'fieldName',
      context.getHandler()
    );

    const fieldNames = this.reflector.get<string[]>(
      'fieldNames',
      context.getHandler()
    );
    if (Array.isArray(req.files)) {
      const files = {};
      req.files?.forEach((file) => {
        const { fieldname: _fieldname, ...newFile } = file;
        files[file.fieldname] = [...(files[file.fieldname] || []), newFile];
      });
      req.files = files;
    }

    const missingFields = _.difference(
      fieldNames || (fieldName ? [fieldName] : []),
      Object.keys(req.files || (req.file ? { [req.file.fieldname]: 1 } : {}))
    );
    if (isRequired && missingFields.length) {
      return next.handle().pipe(() => {
        throw new BadRequestException(
          `${missingFields.join(', ')} should not be empty`
        );
      });
    }

    if (isSingle && !fieldName && fieldNames?.length) {
      Object.keys(req.files).forEach((fieldName) => {
        req.files[fieldName] = Object.assign({}, ...req.files[fieldName]);
      });
    }

    if (req.file || req.files) {
      Object.keys(req.body)?.forEach((key) => {
        try {
          req.body[key] = JSON.parse(req.body[key].replace('\r\n', ''));
        } catch {
          if (_(req.body[key]).isNumber()) {
            req.body[key] = _(req.body[key]).toNumber();
          } else if (['true', 'false']?.includes(req.body[key])) {
            req.body[key] = req.body[key] === 'true';
          }
        }
      });
    }
    return next.handle();
  }
}
