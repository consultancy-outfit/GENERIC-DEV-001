import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { createHmac } from 'crypto';
import { VerifyTokenDto, RefreshTokenDto } from '../dto/token';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  protected readonly logger = new Logger('AUTH_TOKEN_MICROSERVICE');

  constructor(
    private config: ConfigService,
    private jwtService: JwtService
  ) {}

  async signToken(payload): Promise<string> {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_SECRET'),
    });
    return accessToken;
  }

  async verifyToken({ token }: VerifyTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('JWT_SECRET'),
      });
      return {
        data: payload,
        message: '',
        errors: null,
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid Authorization Token.');
    }
  }

  async refreshToken({ refreshToken }: RefreshTokenDto) {
    try {
      const { data } = await this.verifyToken({
        token: refreshToken,
      });

      delete data.iat;
      delete data.exp;

      const accessToken = await this.signToken({
        ...data,
      });

      return {
        data: {
          authToken: accessToken,
          refreshToken: accessToken,
          expiresIn: 43200,
        },
        message: 'Successfully refreshed token.',
        errors: null,
      };
    } catch (err) {
      throw new RpcException(err?.message);
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
