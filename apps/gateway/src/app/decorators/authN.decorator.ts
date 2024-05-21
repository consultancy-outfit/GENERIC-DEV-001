import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
/**
 * @description AuthN is used for JWT Authentication
 */
export const AuthN = (type?: string) =>
  applyDecorators(
    SetMetadata('routeType', type),
    SetMetadata('authenticatedOnly', true),
    ApiBearerAuth()
  );
