import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AuthN } from './authN.decorator';
import { AuthZ } from './authZ.decorator';
/**
 * @description ApiDescription adds description to the route
 */
interface ApiOperationData {
  name?: string;
  description?: string;
  permission?: string | string[];
}
export const ApiRoute = (data: ApiOperationData) => {
  const { name, description, permission } = data;
  const permissionId = Array.isArray(permission)
    ? permission.join('|')
    : permission;
  return applyDecorators(
    !data.permission ? AuthN() : AuthZ(permissionId),
    ApiOperation({
      ...data,
      ...(permissionId && {
        summary:
          permission == '*'
            ? '[Open Access]'
            : `[Permission ID: ${permissionId}]`,
      }),
    }),
    SetMetadata('auditLogMessage', { name, description })
  );
};
