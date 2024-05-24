import {
  Body,
  Controller,
  Inject,
  Post,
  Logger,
  Req,
  Put,
  HttpCode,
  HttpStatus,
  ConflictException,
  Get,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiDescription, ApiRoute } from '@gateway/decorators';
import { ClientRMQ } from '@nestjs/microservices';
import {
  MESSAGE_PATTERNS,
  NOTIFICATION_PATTERNS,
  Role,
  SERVICES,
  VerificationStatusEnum,
} from '@shared/constants';
import {
  SigninRequestDto,
  SignupRequestDto,
  SignOutResponseDto,
  SigninResponseDto,
  SignupResponseDto,
  ResendLinkResponseDto,
  ResendLinkRequestDto,
} from '../dto/auth';
import { firstValueFrom } from 'rxjs';
import { UpdateIdentitySessionDto } from '../dto/auth/update-ig-session.dto';
import { AACApiDto } from '@shared/dto';
const {
  AUTH: { SIGNUP, SIGNIN },
} = MESSAGE_PATTERNS.USER_ACCOUNT_PROFILE;

const {
  USER: {
    CREATE_USER_DB,
    GET_USER,
    CHECK_USER_EMAIL_OR_PHONE,
    IG_VERIFICATION,
    VERIFICATION_UPDATE,
    SEND_AAC_LEAD,
  },
} = MESSAGE_PATTERNS.USER_ACCOUNT_PROFILE;

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    @Inject(SERVICES.USER_ACCOUNT_PROFILE) private userAuthClient: ClientRMQ,
    @Inject(SERVICES.NOTIFICATION) private notification: ClientRMQ
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiDescription('Account Sign up')
  @ApiCreatedResponse({
    type: SignupResponseDto,
  })
  async companySignup(@Body() dto: SignupRequestDto) {
    const data: AACApiDto = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phoneNumber: dto.contactNumber,
      dateOfBirth: dto.dob,
      address: dto.address,
      companyName: dto.companyName,
    };
    const { firstName, lastName, email } = dto;
    const isUniqueEmail = await firstValueFrom(
      this.userAuthClient.send(CHECK_USER_EMAIL_OR_PHONE, {
        type: 'email',
        value: dto.email,
      })
    );

    if (isUniqueEmail) {
      throw new ConflictException('Email is already registered.');
    }

    const signupResponse = await firstValueFrom(
      this.userAuthClient.send(SIGNUP, {
        password: dto.password,
      })
    );
    await firstValueFrom(
      this.userAuthClient.send(CREATE_USER_DB, {
        _id: signupResponse?.data?.userId,
        temporaryPassword: false,
        defaultRole: Role.USER,
        ...dto,
        password: signupResponse?.data?.hashedPassword,
      })
    );

    this.userAuthClient.emit(IG_VERIFICATION, {
      userId: signupResponse?.data?.userId,
      email,
      firstName,
      lastName,
    });

    return { userId: signupResponse?.data?.userId };
  }

  @Post('resend-verificaiton-link')
  @ApiDescription('Resend Link')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: ResendLinkResponseDto,
  })
  async resendLink(@Body() dto: ResendLinkRequestDto) {
    const user = await firstValueFrom(
      this.userAuthClient.send(GET_USER, {
        userId: dto.userId,
      })
    );
    this.userAuthClient.emit(IG_VERIFICATION, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userId: user._id,
      again: true,
    });
    return null;
  }

  @Put('signin')
  @ApiDescription('Account Login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: SigninResponseDto,
  })
  async signin(@Body() dto: SigninRequestDto) {
    let userProfile: any = {};

    const { user, authToken, refreshToken, expiresIn } = await firstValueFrom(
      this.userAuthClient.send(SIGNIN, dto)
    );

    const userProfileData = await firstValueFrom(
      this.userAuthClient.send(GET_USER, { userId: user.userId })
    );
    userProfile = userProfileData;

    return {
      authToken: authToken,
      refreshToken: refreshToken,
      expiresIn: expiresIn,
      user: { ...user, ...userProfile },
    };
  }

  // @Put('verify-token')
  // @ApiDescription('Account Login Social')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   type: VerifyTokenResponseDto,
  // })
  // async verifyToken(@Body() dto: VerifyTokenRequestDto) {
  //   if (!dto.idToken) {
  //     const { data } = await firstValueFrom(
  //       this.userAuthClient.send(VERIFY_TOKEN, {
  //         token: dto.accessToken,
  //       })
  //     );
  //     return { user: { ...data } };
  //   }
  //   const { data } = await firstValueFrom(
  //     this.userAuthClient.send(VERIFY_TOKEN, {
  //       tokenUse: 'id',
  //       token: dto.idToken,
  //     })
  //   );

  //   const { userId, googleUserId, ..._user } = data;

  //   const { data: _userProfileData } = await firstValueFrom(
  //     this.userAuthClient.send(ADMIN_GET_USER, {
  //       userId: googleUserId || userId,
  //     })
  //   );

  //   return { user: { ...data } };
  // }

  // @Put('refresh-token')
  // @ApiDescription('Account Refreshed Token')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   type: RefreshTokenResponse,
  // })
  // async refreshToken(@Body() dto: RefreshTokenDto) {
  //   const response: any = await firstValueFrom(
  //     this.userAuthClient.send(REFRESH_TOKEN, {
  //       email: dto.userId?.toLowerCase(),
  //       refreshToken: dto.refreshToken,
  //     })
  //   );
  //   return response?.data;
  // }

  // @Post('set-new-password')
  // @ApiDescription('Changed Temporary Password')
  // @HttpCode(HttpStatus.CREATED)
  // @ApiCreatedResponse({
  //   type: ChangePasswordResponseDto,
  // })
  // async setNewPassword(@Body() dto: SetNewPasswordRequestDto) {
  //   const { email } = dto;

  //   const response = await firstValueFrom(
  //     this.userAuthClient.send(SET_NEW_PASSWORD, { ...dto })
  //   );
  //   // Get User Role
  //   const userProfile = await firstValueFrom(
  //     this.userAuthClient.send(CHECK_USER_EMAIL_OR_PHONE, {
  //       type: 'email',
  //       value: email,
  //     })
  //   );

  //   // for employee update the employee status
  //   const obj = {
  //     userId: userProfile._id,
  //     isActive: true,
  //   };
  //   await firstValueFrom(this.userAuthClient.send(UPDATE_USER, obj));
  //   return response?.data;
  // }

  // @Post('forgot-password')
  // @ApiDescription('Forgot Password')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   type: ForgotPasswordResponseDto,
  // })
  // async forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
  //   const response = await firstValueFrom(
  //     this.userAuthClient.send(FORGOT_PASSWORD, dto)
  //   );
  //   return response;
  // }

  // @Post('confirm-forgot-password')
  // @ApiDescription('Confirmed Forgot Password')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   type: ConfirmForgotPasswordResponseDto,
  // })
  // async confirmForgotPassword(@Body() dto: ConfirmForgotPasswordRequestDto) {
  //   const response = await firstValueFrom(
  //     this.userAuthClient.send(CONFIRM_FORGOT_PASSWORD, dto)
  //   );
  //   return response;
  // }

  @Post('verification-update')
  @ApiDescription('IdentityGram Verification Webhook listener')
  @HttpCode(HttpStatus.OK)
  async verificationUpdate(@Body() dto: UpdateIdentitySessionDto) {
    const response = await firstValueFrom(
      this.userAuthClient.send(VERIFICATION_UPDATE, { ...dto })
    );
    if (dto.status === VerificationStatusEnum.APPROVED) {
      const data: AACApiDto = {
        email: response?.email,
        firstName: response?.firstName,
        lastName: response?.lastName,
        phoneNumber: response?.contactNumber,
        dateOfBirth: response?.dob,
        address: response?.address,
        companyName: response?.companyName,
      };
      this.userAuthClient.emit(SEND_AAC_LEAD, data);

      this.notification.emit(NOTIFICATION_PATTERNS.GENERAL.SIGNUP_SUCCESS, {
        userId: response?._id,
        firstName: response?.firstName,
        lastName: response?.lastName,
        email: response?.email,
        // password: signupResponse?.data?.password,
      });
    }
    return response;
  }

  // @Post('change-password')
  // @ApiRoute({
  //   name: 'Change Password',
  //   description: 'Change User Password',
  // })
  // @ApiDescription('Changed Password')
  // @HttpCode(HttpStatus.CREATED)
  // @ApiCreatedResponse({
  //   type: ChangePasswordResponseDto,
  // })
  // async changePassword(
  //   @Req() request: Request,
  //   @Body() dto: ChangePasswordRequestDto
  // ) {
  //   const accessToken = request.headers.authorization.replace('Bearer ', '');
  //   await firstValueFrom(
  //     this.userAuthClient.send(CHANGE_PASSWORD, { accessToken, ...dto })
  //   );
  //   return null;
  // }

  // @Put('verify-password')
  // @ApiRoute({
  //   name: 'account verify password',
  //   description: 'Account Verify Password',
  // })
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   type: VerifyPasswordResponseDto,
  // })
  // async verifyPassword(@Body() dto: VerifyPasswordRequestDto) {
  //   const { user } = await firstValueFrom(
  //     this.userAuthClient.send(SIGNIN, dto)
  //   );
  //   return { userId: user?.userId };
  // }

  @Put('signout')
  @ApiRoute({
    name: 'Account sign out',
    description: 'Account Sign out',
  })
  @ApiOkResponse({
    type: SignOutResponseDto,
  })
  async signout() {
    return null;
  }
}
