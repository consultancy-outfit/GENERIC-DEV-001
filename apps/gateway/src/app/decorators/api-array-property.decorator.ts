import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import {
  SwaggerQueryParamStyle,
  SwaggerStyleSeparators,
} from '@shared/constants';
import { Transform } from 'class-transformer';

export const ApiArrayProperty = ({
  style = SwaggerQueryParamStyle.CSV,
  mapperFn = (_) => _.trim(),
  ...props
}: ApiPropertyOptions & {
  style?: SwaggerQueryParamStyle;
  mapperFn?: (value: any, index?: number, array?: any[]) => any;
}) => {
  const swaggerProps = {
    ...props,
    style,
    explode: false,
    type: props.type ?? [String],
  };

  return applyDecorators(
    ApiProperty(swaggerProps),
    Transform(({ value }) =>
      (value as string)
        .split(SwaggerStyleSeparators[style])
        .filter((_) => _ !== '')
        .map(mapperFn)
    )
  );
};
