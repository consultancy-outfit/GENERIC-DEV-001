import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
/**
 * @description ApiMultipleFiles specifies multiple files
 */
export const ApiMultipleFiles = (
  apiOptions?: Omit<ApiPropertyOptions, 'type' | 'items'>
) =>
  applyDecorators(
    ApiProperty({
      type: 'array',
      items: {
        type: 'string',
        format: 'binary',
      },
      ...apiOptions,
    })
  );
