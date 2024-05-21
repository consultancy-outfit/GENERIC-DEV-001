import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { NestJsNotification } from '../services/nestjs-notification.service';
import { NOTIFICATION_PATTERNS } from '@shared/constants';
import { UpdateOnboardingStatusNotification } from '../notifications/GENERAL/update-onboarding-status.notification';
import { VerificationStatusNotification } from '../notifications/GENERAL/verification-status.notification';
import { InitiateMailNotification } from '../notifications/GENERAL/initiate-mail.notification';
import { SignupSuccessNotification } from '../notifications/GENERAL/signup-success.notification';
import type { ISendMailOptions } from '@nestjs-modules/mailer';

@Controller()
export class NotificationController {
  constructor(private sendNotification: NestJsNotification) {}

  @MessagePattern('health-check')
  async healthCheck() {
    return {
      healthCheckPassed: true,
      healthCheck: 'Excellent',
    };
  }

  @EventPattern(NOTIFICATION_PATTERNS.GENERAL.INITIATE_MAIL)
  async initiateMail(options: ISendMailOptions): Promise<void> {
    const notification = new InitiateMailNotification(options);
    await this.sendNotification.send(notification);
  }

  @EventPattern(NOTIFICATION_PATTERNS.GENERAL.SIGNUP_SUCCESS)
  async signupSuccess(user): Promise<void> {
    const notification = new SignupSuccessNotification(user);
    await this.sendNotification.send(notification);
  }

  @EventPattern(NOTIFICATION_PATTERNS.GENERAL.NOTIFICATION_ONBOARDING_STATUS)
  async updateOnboarding(user): Promise<void> {
    const notification = new UpdateOnboardingStatusNotification(user);
    await this.sendNotification.send(notification);
  }

  @EventPattern(NOTIFICATION_PATTERNS.GENERAL.VERIFICATION_STATUS)
  async verificationStatus(user): Promise<void> {
    const notification = new VerificationStatusNotification(user);
    await this.sendNotification.send(notification);
  }
}
