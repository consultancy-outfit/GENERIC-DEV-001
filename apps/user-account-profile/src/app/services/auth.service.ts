import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { createHmac } from 'crypto';
import { ChangePasswordDto, SigninDto } from '../dto/auth';
import { TokenService } from './token.service';
import { SetNewPassword, SetPassword } from '../dto/auth/set-new-password.dto';
import { UserRepository } from '@shared/repository';
import * as bcrypt from 'bcrypt';
import { v4 } from 'uuid';
import { generate } from 'generate-password';

@Injectable()
export class AuthService {
  protected readonly logger = new Logger(AuthService.name);

  constructor(
    private config: ConfigService,
    private tokenService: TokenService,
    private userRepository: UserRepository
  ) {}

  public async signup({ password }) {
    try {
      const userId = v4();
      const finalPassword =
        password ??
        generate({
          length: 10,
          uppercase: true,
          lowercase: true,
          symbols: true,
        });
      const hashedPassword = await bcrypt.hash(
        finalPassword,
        +this.config.get('JWT_HASH_SALT')
      );
      return {
        data: {
          userId,
          password: finalPassword,
          hashedPassword,
        },
        message: 'User Added Successfully, Credentials sent to provided email.',
        errors: null,
      };
    } catch (err) {
      throw new RpcException(err?.message);
    }
  }

  async setPassword(data: SetPassword) {
    const { email, newPassword } = data;

    try {
      const hashedPassword = await bcrypt.hash(
        newPassword,
        +this.config.get('JWT_HASH_SALT')
      );
      await this.userRepository.findOneAndUpdate(
        {
          $or: [
            {
              _id: email,
            },
            {
              email: email,
            },
          ],
        },
        {
          password: hashedPassword,
        }
      );
      return true;
    } catch (err) {
      throw new RpcException(err?.message);
    }
  }

  async setNewPassword(data: SetNewPassword) {
    const { email, newPassword, tempPassword } = data;
    try {
      const user = await this.userRepository.findOne(
        {
          $or: [
            {
              _id: email,
            },
            {
              email: email,
            },
          ],
        },
        {
          _id: 1,
          email: 1,
          password: 1,
          temporaryPassword: 1,
        },
        {
          notFoundThrowError: 'No such user exists',
        }
      );

      if (user.temporaryPassword) {
        const matched = await bcrypt.compare(tempPassword, user.password);
        if (!matched) {
          throw new UnauthorizedException(
            'Invalid temporary password entered.'
          );
        }
        const hashedPassword = await bcrypt.hash(
          newPassword,
          +this.config.get('JWT_HASH_SALT')
        );
        await this.userRepository.findOneAndUpdate(
          {
            _id: user._id,
          },
          {
            password: hashedPassword,
            temporaryPassword: false,
          }
        );
      } else {
        return {
          data: null,
          message:
            'You Already Change Your Password. If you Forget Please Reset Your Password',
          errors: null,
        };
      }
    } catch (err) {
      throw new RpcException(err?.message);
    }
  }

  // public async verifyEmail(data: VerifyEmailDto) {
  //   const { userId, code } = data;
  //   try {
  //     const SecretHash = this.getSecretHash(
  //       userId,
  //       this.config.get('COGNITO_CLIENT_ID'),
  //       this.config.get('COGNITO_CLIENT_SECRET')
  //     );

  //     const params: ConfirmSignUpRequest = {
  //       ClientId: this.config.get('COGNITO_CLIENT_ID'),
  //       SecretHash,
  //       Username: userId,
  //       ConfirmationCode: code,
  //     };

  //     await this.cognitoIDP.confirmSignUp(params);
  //     return {
  //       data: null,
  //       message: 'Your email address is verified successfully.',
  //       errors: null,
  //     };
  //   } catch (err) {
  //     throw new RpcException(err?.message);
  //   }
  // }

  // public async forgotPassword(data: ForgotPasswordDto) {
  //   try {
  //     const { email } = data;
  //     const SecretHash = this.getSecretHash(
  //       email,
  //       this.config.get('COGNITO_CLIENT_ID'),
  //       this.config.get('COGNITO_CLIENT_SECRET')
  //     );

  //     const params: ForgotPasswordRequest = {
  //       ClientId: this.config.get('COGNITO_CLIENT_ID'),
  //       SecretHash,
  //       Username: email,
  //     };
  //     return await this.cognitoIDP.forgotPassword(params);
  //   } catch (err) {
  //     throw new RpcException(err?.message);
  //   }
  // }

  // public async confirmForgotPassword(data: ConfirmForgotPasswordDto) {
  //   try {
  //     const { email, code, password } = data;
  //     const SecretHash = this.getSecretHash(
  //       email,
  //       this.config.get('COGNITO_CLIENT_ID'),
  //       this.config.get('COGNITO_CLIENT_SECRET')
  //     );

  //     const params: ConfirmForgotPasswordRequest = {
  //       ClientId: process.env.COGNITO_CLIENT_ID,
  //       Username: email,
  //       ConfirmationCode: code,
  //       Password: password,
  //       SecretHash,
  //     };
  //     return await this.cognitoIDP.confirmForgotPassword(params);
  //   } catch (err) {
  //     throw new RpcException(err?.message);
  //   }
  // }

  // public async resendLink(data: ResendLinkDto) {
  //   try {
  //     const { email } = data;
  //     const SecretHash = this.getSecretHash(
  //       email,
  //       this.config.get('COGNITO_CLIENT_ID'),
  //       this.config.get('COGNITO_CLIENT_SECRET')
  //     );

  //     const params: ResendConfirmationCodeRequest = {
  //       ClientId: process.env.COGNITO_CLIENT_ID,
  //       Username: email,
  //       SecretHash,
  //     };

  //     await this.cognitoIDP.resendConfirmationCode(params);
  //     return {
  //       data: null,
  //       message: 'Link is resent. Kindly check your email address.',
  //       errors: null,
  //     };
  //   } catch (err) {
  //     throw new RpcException(err?.message);
  //   }
  // }

  public async signin(data: SigninDto) {
    const { email, password } = data;
    try {
      // const hash = await bcrypt.hash(password, +this.config.get('JWT_HASH_SALT'));
      // const hash = await bcrypt.hash(password, +this.config.get('JWT_HASH_SALT')); Hash Gen
      const user = await this.userRepository.findOne(
        { email },
        {
          userId: '$_id',
          email: '$email',
          roles: [{ $ifNull: ['$role', '$defaultRole'] }],
          password: '$password',
          temporaryPassword: '$temporaryPassword',
        },
        {
          notFoundThrowError: false,
        }
      );
      if (!user) {
        throw new UnauthorizedException('No user exists with the given email.');
      }

      if (user?.temporaryPassword) {
        throw new UnauthorizedException(
          'Please change your temporary password first.'
        );
      }

      const matched = await bcrypt.compare(password, user.password);
      if (!matched) {
        throw new UnauthorizedException('Invalid password entered.');
      }
      delete user.password;
      const accessToken = await this.tokenService.signToken(user);
      return {
        authToken: accessToken,
        refreshToken: accessToken, // Will implement Refresh Token
        expiresIn: 43200,
        user: user,
      };
    } catch (err) {
      throw new UnauthorizedException(err?.message);
    }
  }

  // public async signout(data: SignOutDto) {
  //   const { accessToken } = data;
  //   try {
  //     const params: GlobalSignOutRequest = {
  //       AccessToken: accessToken,
  //     };

  //     return await this.cognitoIDP.globalSignOut(params);
  //   } catch (err) {
  //     throw new RpcException(err?.message);
  //   }
  // }

  // public async resetPassword(payload: { email: string }) {
  //   try {
  //     const { email } = payload;
  //     const params: AWS.AdminResetUserPasswordRequest = {
  //       Username: email,
  //       UserPoolId: this.config.get('COGNITO_USER_POOL_ID'),
  //     };
  //     await this.cognitoIDP.adminResetUserPassword(params);
  //     return {
  //       data: null,
  //       message: 'User password is reset. Kindly check your email address.',
  //       errors: null,
  //     };
  //   } catch (err) {
  //     throw new RpcException(err?.message);
  //   }
  // }

  public async changePassword(data: ChangePasswordDto) {
    const { accessToken, oldPassword, newPassword } = data;
    const {
      data: { userId },
    } = await this.tokenService.verifyToken({ token: accessToken });
    const user = await this.userRepository.findOne(
      {
        _id: userId,
      },
      {
        _id: 1,
        email: 1,
        password: 1,
        temporaryPassword: 1,
      },
      {
        notFoundThrowError: false,
      }
    );

    const matched = await bcrypt.compare(oldPassword, user.password);
    if (!matched) {
      throw new UnauthorizedException('Invalid current password entered.');
    }

    if (!user.temporaryPassword) {
      const hashedPassword = await bcrypt.hash(
        newPassword,
        +this.config.get('JWT_HASH_SALT')
      );
      await this.userRepository.findOneAndUpdate(
        {
          _id: user._id,
        },
        {
          password: hashedPassword,
          temporaryPassword: false,
        }
      );
      return {
        data: null,
        message: 'Password is updated.',
        errors: null,
      };
    } else {
      return {
        data: null,
        message: 'You should reset your password first.',
        errors: null,
      };
    }
  }

  private getSecretHash(
    username: string,
    clientId: string,
    clientSecret: string
  ) {
    const hasher = createHmac('sha256', clientSecret);
    hasher.update(`${username}${clientId}`);
    return hasher.digest('base64');
  }
}
