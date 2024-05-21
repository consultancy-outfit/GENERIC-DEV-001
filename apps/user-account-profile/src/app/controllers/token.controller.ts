import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@shared/constants';
import { VerifyTokenDto, RefreshTokenDto } from '../dto/token';
import { TokenService } from '../services/token.service';

const { VERIFY_TOKEN, REFRESH_TOKEN } = MESSAGE_PATTERNS.USER_ACCOUNT_PROFILE.TOKEN;

@Controller()
export class TokenController {
  private readonly logger = new Logger(TokenController.name);
  constructor(private readonly tokenService: TokenService) {}

  @MessagePattern(VERIFY_TOKEN)
  async verifyToken(@Payload() payload: VerifyTokenDto) {
    return await this.tokenService.verifyToken(payload);
  }

  @MessagePattern(REFRESH_TOKEN)
  async refreshToken(@Payload() payload: RefreshTokenDto) {
    return await this.tokenService.refreshToken(payload);
  }
}
