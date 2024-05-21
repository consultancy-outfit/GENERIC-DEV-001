import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
/**
 * @description ApiPagination is used for applying search, limit, offset pagination
 */
export const ApiPagination = (searchDescription?: string) =>
  applyDecorators(
    ApiQuery({
      name: 'limit',
      schema: {
        type: 'number',
        default: 10,
      },
      required: true,
    }),
    ApiQuery({
      name: 'offset',
      schema: {
        type: 'number',
        default: 0,
      },
      required: true,
    }),
    ApiQuery({
      name: 'search',
      description: searchDescription,
      schema: {
        type: 'string',
      },
      required: false,
    })
  );
