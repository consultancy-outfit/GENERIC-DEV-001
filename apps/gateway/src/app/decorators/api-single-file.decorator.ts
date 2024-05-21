import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
/**
 * @description ApiSingleFile specifies a single file
 */
export const ApiSingleFile = (
  apiOptions?: Omit<ApiPropertyOptions, 'type' | 'format'>
) =>
  applyDecorators(
    ApiProperty({
      type: 'string',
      format: 'binary',
      ...apiOptions,
    })
  );
