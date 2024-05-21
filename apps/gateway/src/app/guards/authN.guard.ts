import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientRMQ } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UserDisabledException } from '../exceptions/user-disabled.exception';
import { AccessRevokedException } from '../exceptions/user-access-revoked.exception';
import { MESSAGE_PATTERNS, Role, SERVICES } from '@shared/constants';

const {
  TOKEN: { VERIFY_TOKEN },
} = MESSAGE_PATTERNS.USER_ACCOUNT;
const { GET_USER_FOR_AUTH } = MESSAGE_PATTERNS.USER_PROFILE.USER;

const NO_LOGIN_AS_ROUTES = ['/auth/signout', '/employees/:id/login-as'];

@Injectable()
export class AuthNGuard implements CanActivate {
  private readonly logger = new Logger('AuthNGuard');
  constructor(
    private reflector: Reflector,
    @Inject(SERVICES.USER_ACCOUNT) private authClient: ClientRMQ,
    @Inject(SERVICES.USER_PROFILE) private userClient: ClientRMQ
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const secured = this.reflector.get<boolean>(
      'authenticatedOnly',
      context.getHandler()
    );

    if (secured) {
      const myTeamAccess = this.reflector.get<boolean>(
        'myTeamAccess',
        context.getHandler()
      );

      try {
        const token = this.getToken(context);
        const { data: user } = await firstValueFrom(
          this.authClient.send(VERIFY_TOKEN, { token })
        );
        let userProfile;
        const { data } = await firstValueFrom(
          this.userClient.send(GET_USER_FOR_AUTH, { userId: user.userId })
        );

        userProfile = data;

        if (userProfile?.isActive !== undefined && !userProfile?.isActive) {
          throw new UserDisabledException(
            'Your account has been disabled by administrator, please contact administrator for further details.'
          );
        }

        if (userProfile.revokeAccess && userProfile.revokeAccess != '') {
          const diff =
            new Date().getTime() - new Date(userProfile.revokeAccess).getTime();
          if (diff > 0) {
            throw new AccessRevokedException('Your account has been revoked');
          }
        }

        if (userProfile.loggedInAs) {
          const request = context.switchToHttp().getRequest();
          if (
            request.method != 'GET' &&
            !NO_LOGIN_AS_ROUTES.includes(request.route.path)
          ) {
            throw new ForbiddenException(
              'Unable to perform this operation in this session.'
            );
          }
          if (!NO_LOGIN_AS_ROUTES.includes(request.route.path)) {
            const { data } = await firstValueFrom(
              this.userClient.send(GET_USER_FOR_AUTH, {
                userId: userProfile.loggedInAs,
              })
            );
            context.switchToHttp().getRequest().loggedInBy = userProfile.userId;
            userProfile = data;
          }
        }

        if (myTeamAccess) {
          const request = context.switchToHttp().getRequest();
          if (request.query.memberId) {
            const { data } = await firstValueFrom(
              this.userClient.send(GET_USER_FOR_AUTH, {
                userId: request.query.memberId,
              })
            );
            if (
              data.managerId === userProfile.userId ||
              userProfile.defaultRole === Role.COMPANY_ADMIN
            ) {
              userProfile = data;
            } else {
              throw new ForbiddenException(
                'Unable to perform this operation for this user.'
              );
            }
          }
        }

        this.appendUser(
          { ...user, userId: userProfile.userId },
          userProfile,
          context
        );
      } catch (err) {
        if (err.failedAssertion) {
          throw new UnauthorizedException('Token expired.');
        } else if (err instanceof ForbiddenException) {
          throw err;
        }
        throw new UnauthorizedException(err.message);
      }
    }

    return true;
  }

  private getToken(context: ExecutionContext) {
    let authorization: string;
    if (context.getType() === 'rpc') {
      authorization = context.switchToRpc().getData().authorization;
    } else if (context.getType() === 'http') {
      authorization = context
        .switchToHttp()
        .getRequest()
        .headers?.authorization?.replace('Bearer ', '');
    }
    if (!authorization) {
      throw new Error('No value was provided for Authorization');
    }
    return authorization;
  }

  private appendUser(user: any, userProfile: any, context: ExecutionContext) {
    if (context.getType() === 'rpc') {
      context.switchToRpc().getData().user = user;
      context.switchToRpc().getData().userProfile = userProfile;
    } else if (context.getType() === 'http') {
      context.switchToHttp().getRequest().user = user;
      context.switchToHttp().getRequest().userProfile = userProfile;
    }
  }
}
