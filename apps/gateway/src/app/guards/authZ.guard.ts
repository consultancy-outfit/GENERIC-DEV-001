import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientRMQ } from '@nestjs/microservices';
import { SERVICES } from '@shared/constants';

@Injectable()
export class AuthZGuard implements CanActivate {
  private readonly logger = new Logger('AuthZGuard');
  constructor(
    private reflector: Reflector,
    @Inject(SERVICES.USER_ACCOUNT_PROFILE) private permissionClient: ClientRMQ
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authorizedOnly = this.reflector.get<boolean>(
      'authorizedOnly',
      context.getHandler()
    );

    if (!authorizedOnly) {
      return true;
    }

    try {
      const user = context.switchToHttp().getRequest()?.user;
      const userProfile = context.switchToHttp().getRequest()?.userProfile;
      const userRoles = [userProfile.defaultRole];

      const permission: string | null = this.reflector.get(
        'permission',
        context.getHandler()
      );

      // if (userProfile.defaultRole != Role.SUPER_ADMIN) {
      //   if (permission !== '*') {
      //     let finalPermissions = userProfile?.userPermissions;
      //     if (userProfile?.menuPermissions?.length) {
      //       const menuPermissions = userProfile?.menuPermissions?.map(
      //         (permission) =>
      //           `${permission.split('.')[1]}.${permission.split('.')[2]}`
      //       );
      //       Object.entries(MENU_PERMISSIONS).forEach(([k, v]) => {
      //         !menuPermissions.includes(k) &&
      //           (finalPermissions = finalPermissions.filter(
      //             (p) => !v.PERMISSIONS.includes(p)
      //           ));
      //       });
      //     }
      //     const hasPermission = permission
      //       .split('|')
      //       .find((p) => finalPermissions.includes(p));
      //     if (!hasPermission) {
      //       throw Error("You don't have a permission to access this route");
      //     }
      //   }
      // }

      context.switchToHttp().getRequest().user = {
        ...user,
        ...userProfile,
        roles: userRoles,
        permission: permission,
        is_permitted: true,
      };
      return true;
    } catch (err) {
      throw new ForbiddenException(
        "You don't have a permission to access this route"
      );
    }
  }
}
