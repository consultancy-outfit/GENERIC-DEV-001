import { applyDecorators, SetMetadata } from '@nestjs/common';
import { AuthN } from './authN.decorator';
/**
 * @description AuthZ is used for Role-based Authorization
 */
export const AuthZ = (permission: string) =>
  applyDecorators(
    AuthN(),
    SetMetadata('permission', permission),
    SetMetadata('authorizedOnly', true)
  );
