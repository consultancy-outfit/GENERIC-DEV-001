import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export const ApiBooleanProperty = (props?: ApiPropertyOptions) => {
  const swaggerProps = {
    type: Boolean,
    ...props,
  };

  return applyDecorators(
    ApiProperty({ required: false, ...swaggerProps }),
    ...(props?.required ? [IsNotEmpty()] : [IsOptional()]),
    IsBoolean(),
    Transform(({ obj, key }) => {
      return obj[key] === 'true';
    })
  );
};
