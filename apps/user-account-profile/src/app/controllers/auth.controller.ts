import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@shared/constants';
import {
  SigninDto,
  ChangePasswordDto,
} from '../dto/auth';
import { AuthService } from '../services/auth.service';
import { SetNewPassword } from '../dto/auth/set-new-password.dto';

const {
  SIGNUP,
  SIGNIN,
  CHANGE_PASSWORD,
  SET_NEW_PASSWORD,
} = MESSAGE_PATTERNS.USER_ACCOUNT_PROFILE.AUTH;

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('health-check')
  async healthCheck() {
    return {
      healthCheckPassed: true,
      healthCheck: 'Excellent',
    };
  }

  @MessagePattern(SIGNUP)
  async signup() {
    return await this.authService.signup();
  }

  @MessagePattern(SET_NEW_PASSWORD)
  async setNewPassword(@Payload() payload: SetNewPassword) {
    return await this.authService.setNewPassword(payload);
  }

  // @MessagePattern(VERIFY_EMAIL)
  // async verifyEmail(@Payload() payload: VerifyEmailDto) {
  //   return await this.authService.verifyEmail(payload);
  // }

  @MessagePattern(SIGNIN)
  async signin(@Payload() payload: SigninDto) {
    return await this.authService.signin(payload);
  }

  // @MessagePattern(COMPANY_APPROVAL)
  // async companyApprove(@Payload() payload: ResendLinkDto) {
  //   return await this.authService.approveCompany(payload);
  // }

  // @MessagePattern(RESET_PASSWORD)
  // async resetPassword(@Payload() payload: { email: string }) {
  //   return await this.authService.resetPassword(payload);
  // }

  // @MessagePattern(SIGNOUT)
  // async signout(@Payload() payload: SignOutDto) {
  //   return await this.authService.signout(payload);
  // }

  @MessagePattern(CHANGE_PASSWORD)
  async changePassword(@Payload() payload: ChangePasswordDto) {
    return await this.authService.changePassword(payload);
  }

  // @MessagePattern(FORGOT_PASSWORD)
  // public async forgotPassword(@Payload() payload: ForgotPasswordDto) {
  //   return await this.authService.forgotPassword(payload);
  // }

  // @MessagePattern(CONFIRM_FORGOT_PASSWORD)
  // public async confirmForgotPassword(
  //   @Payload() payload: ConfirmForgotPasswordDto
  // ) {
  //   return await this.authService.confirmForgotPassword(payload);
  // }

  // @MessagePattern(RESEND_LINK)
  // async resendLink(@Payload() payload: ResendLinkDto) {
  //   return await this.authService.resendLink(payload);
  // }

  // @MessagePattern(LIST_CONNECTED_DEVICES)
  // async listConnectedDevices(@Payload() payload: ListConnectedDevicesDto) {
  //   return await this.authService.listConnectedDevices(payload);
  // }
}
