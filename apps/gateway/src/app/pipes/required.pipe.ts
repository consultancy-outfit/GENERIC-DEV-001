import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { toTitleCase } from '@shared/utils';

@Injectable()
export class RequiredPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value === null || value === undefined || value === '') {
      throw new BadRequestException(
        toTitleCase(metadata.data) + ' is mandatory.'
      );
    }
    return value;
  }
}
