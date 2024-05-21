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
  COMPANIES,
  EmployeeStatus,
  MESSAGE_PATTERNS,
  NOTIFICATION_PATTERNS,
  Role,
  SERVICES,
  VerificationStatusEnum,
} from '@shared/constants';
import {
  SigninRequestDto,
  SignupRequestDto,
  ChangePasswordResponseDto,
  ChangePasswordRequestDto,
  ForgotPasswordRequestDto,
  VerifyPasswordRequestDto,
  VerifyPasswordResponseDto,
  ForgotPasswordResponseDto,
  ConfirmForgotPasswordResponseDto,
  ConfirmForgotPasswordRequestDto,
  SignOutResponseDto,
  SigninResponseDto,
  SignupResponseDto,
  // VerifyEmailResponseDto,
  // ResendLinkResponseDto,
  // ResendLinkRequestDto,
  VerifyTokenResponseDto,
  VerifyTokenRequestDto,
  SetNewPasswordRequestDto,
  RetrievePermissionsResponseDto,
} from '../dto/auth';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';
import {
  RefreshTokenDto,
  RefreshTokenResponse,
} from '../dto/auth/refresh-token.dto';

import { CompanyApprovalRequestDto } from '../dto/auth/company-approval.dto';
import { UpdateIdentitySessionDto } from '../dto/auth/update-ig-session.dto';

const {
  AUTH: {
    SIGNUP,
    // VERIFY_EMAIL,
    // RESEND_LINK,
    FORGOT_PASSWORD,
    CONFIRM_FORGOT_PASSWORD,
    SIGNIN,
    CHANGE_PASSWORD,
    COMPANY_APPROVAL,
    SET_NEW_PASSWORD,
    GET_USER_EMAIL_TO_SET_PASSWORD,
  },
  ADMIN_USER: {
    // ADMIN_ASSIGN_ROLE,
    ADMIN_GET_USER,
  },
  TOKEN: { VERIFY_TOKEN, REFRESH_TOKEN },
} = MESSAGE_PATTERNS.USER_ACCOUNT;

const {
  USER: {
    CREATE_USER_DB,
    GET_USER,
    GET_USER_COMPANY,
    // VERIFY_CHANGE_EMAIL,
    // CHANGE_USER_EMAIL_ON_VERIFY,
    // CHECK_EMAIL,
    CHECK_USER_EMAIL_OR_PHONE,
    // REQUEST_VERIFICATION,
    CREATE_COMPANY,
    IG_VERIFICATION,
    VERIFICATION_UPDATE,
    UPDATE_USER,
    GET_USER_BY_EMAIL,
    LOG_IN_AS_EMPLOYEE,
  },
  COMPANY: { CHECK_REGISTER_COMPANY },
} = MESSAGE_PATTERNS.USER_PROFILE;

const { CREATE_INTERNAL_JOB_BOARD } = MESSAGE_PATTERNS.configuration.JOB_BOARD;

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    @Inject(SERVICES.USER_ACCOUNT) private authClient: ClientRMQ,
    @Inject(SERVICES.USER_PROFILE) private userClient: ClientRMQ,
    @Inject(SERVICES.JOBS) private jobCLient: ClientRMQ,
    @Inject(SERVICES.NOTIFICATION) private notification: ClientRMQ
  ) {}

  @Post('signup-company')
  @HttpCode(HttpStatus.CREATED)
  @ApiDescription('Company Account Sign up')
  @ApiCreatedResponse({
    type: SignupResponseDto,
  })
  async companySignup(@Body() dto: SignupRequestDto) {
    const { companyName, firstName, lastName, email } = dto;

    const isUniqueEmail = await firstValueFrom(
      this.userClient.send(CHECK_USER_EMAIL_OR_PHONE, {
        type: 'email',
        value: dto.email,
      })
    );

    if (isUniqueEmail) {
      throw new ConflictException('Email is already registered.');
    }

    const isUniqueCompany = await firstValueFrom(
      this.userClient.send(CHECK_REGISTER_COMPANY, {
        title: companyName,
      })
    );

    if (isUniqueCompany) {
      throw new ConflictException('Company is already registered.');
    }

    const signupResponse = await firstValueFrom(
      this.authClient.send(SIGNUP, {
        ...dto,
      })
    );

    const companyResponse = await firstValueFrom(
      this.userClient.send(CREATE_COMPANY, {
        ...dto,
        title: companyName,
        userId: signupResponse?.data?.userId,
      })
    );

    await firstValueFrom(
      this.userClient.send(CREATE_USER_DB, {
        _id: signupResponse?.data?.userId,
        password: signupResponse?.data?.hashedPassword,
        temporaryPassword: true,
        businessName: companyName,
        ...dto,
        isCompanyAdmin: true,
        companyId: companyResponse._id,
        defaultRole: Role.COMPANY_ADMIN,
      })
    );

    this.jobCLient.emit(CREATE_INTERNAL_JOB_BOARD, {
      companyId: companyResponse._id,
      companyName,
    });

    this.userClient.emit(IG_VERIFICATION, {
      userId: signupResponse?.data?.userId,
      email,
      firstName,
      lastName,
    });
    return { userId: signupResponse?.data?.userId };
  }

  @Post('approve-company')
  @HttpCode(HttpStatus.CREATED)
  @ApiDescription('Company Account Approval')
  @ApiCreatedResponse({
    type: SignupResponseDto,
  })
  async companyApproval(@Body() dto: CompanyApprovalRequestDto) {
    const userprofile = await firstValueFrom(
      this.userClient.send(GET_USER, {
        ...dto,
      })
    );

    await firstValueFrom(
      this.authClient.send(COMPANY_APPROVAL, {
        email: userprofile?.email,
      })
    );
    return null;
  }

  // @Get('verify-email')
  // @ApiDescription('Verifying Email')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   type: VerifyEmailResponseDto,
  // })
  // async verifyEmail(
  //   @Query('code') code: string,
  //   @Query('userId') userId: string,
  // ) {
  //   const verifyEmail = await firstValueFrom(
  //     this.authClient.send(VERIFY_EMAIL, { code, userId: userId }),
  //   );
  //   if (verifyEmail) {
  //     this.userClient.emit(VERIFY_USER_EMAIL, { userId: userId });
  //   }
  //   const userData = await firstValueFrom(
  //     this.userClient.send(GET_USER_ESSENTIALS, { userId: userId }),
  //   );
  //   return { ...verifyEmail, data: userData };
  // }

  // @Post('resend-link')
  // @ApiDescription('Resend Link')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   type: ResendLinkResponseDto,
  // })
  // async resendLink(@Body() dto: ResendLinkRequestDto) {
  //   return this.authClient.send(RESEND_LINK, dto);
  // }

  // @Get('verification-status')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   status: 200,
  //   schema: {
  //     example: {
  //       data: {
  //         status: 'Approved',
  //         isVerified: true,
  //         startDate: '2022-12-20T11:56:30.652Z'
  //       },
  //       message: 'Got verification status successfully.',
  //       errors: null,
  //     },
  //   },
  // })
  // async verificationStatus(@Query('userId') userId: string) {
  //   const { data } = await firstValueFrom(
  //     this.userClient.send(GET_USER_FOR_AUTH, { userId }),
  //   );
  //   const dateDifference = new Date().getTime() - new Date(data.idVerificationStartDate).getTime();
  //   const daysDifference = Math.floor(dateDifference / (1000 * 60 * 60 * 24));
  //   const disabled = daysDifference > 2;
  //   return {
  //     data: {
  //       role: data.defaultRole,
  //       status: data.idVerificationStatus,
  //       isVerified: data.idVerified,
  //       disabled
  //     },
  //     message: 'Got verification status successfully.',
  //     errors: null,
  //   };
  // }

  // @Post('resend-link')
  // @ApiDescription('Resend Link')
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   type: ResendLinkResponseDto,
  // })
  // async resendLink(@Body() dto: ResendLinkRequestDto) {
  //   const { data: userProfileData } = await firstValueFrom(
  //     this.userClient.send(GET_USER, {
  //       userId: dto.userId,
  //     }),
  //   );
  //   this.userClient.emit(REQUEST_VERIFICATION, {
  //     ...dto,
  //     email: userProfileData.email,
  //     firstName: userProfileData.firstName,
  //     lastName: userProfileData.lastName,
  //     again: true,
  //   });
  //   return null;
  // }

  @Put('signin')
  @ApiDescription('Account Login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: SigninResponseDto,
  })
  async signin(@Body() dto: SigninRequestDto) {
    let userProfile: any = {};

    const { user, authToken, refreshToken, expiresIn } = await firstValueFrom(
      this.authClient.send(SIGNIN, dto)
    );

    if (!userProfile?.googleUserId) {
      const userProfileData = await firstValueFrom(
        this.userClient.send(GET_USER_COMPANY, { userId: user.userId })
      );
      userProfile = userProfileData;
    }
    return {
      authToken: authToken,
      refreshToken: refreshToken,
      expiresIn: expiresIn,
      user: { ...user, ...userProfile },
    };
  }

  @Put('verify-token')
  @ApiDescription('Account Login Social')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: VerifyTokenResponseDto,
  })
  async verifyToken(@Body() dto: VerifyTokenRequestDto) {
    if (!dto.idToken) {
      const { data } = await firstValueFrom(
        this.authClient.send(VERIFY_TOKEN, {
          token: dto.accessToken,
        })
      );
      return { user: { ...data } };
    }
    const { data } = await firstValueFrom(
      this.authClient.send(VERIFY_TOKEN, {
        tokenUse: 'id',
        token: dto.idToken,
      })
    );

    const { userId, googleUserId, ..._user } = data;

    const { data: _userProfileData } = await firstValueFrom(
      this.authClient.send(ADMIN_GET_USER, {
        userId: googleUserId || userId,
      })
    );

    return { user: { ...data } };
  }

  @Put('refresh-token')
  @ApiDescription('Account Refreshed Token')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: RefreshTokenResponse,
  })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    const response: any = await firstValueFrom(
      this.authClient.send(REFRESH_TOKEN, {
        email: dto.userId?.toLowerCase(),
        refreshToken: dto.refreshToken,
      })
    );
    return response?.data;
  }

  @Post('set-new-password')
  @ApiDescription('Changed Temporary Password')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: ChangePasswordResponseDto,
  })
  async setNewPassword(@Body() dto: SetNewPasswordRequestDto) {
    const { email: userId } = dto;

    const response = await firstValueFrom(
      this.authClient.send(SET_NEW_PASSWORD, { ...dto })
    );
    // Get User Role
    const userProfile = await firstValueFrom(
      this.userClient.send(GET_USER_BY_EMAIL, {
        email: userId,
      })
    );

    // for employee update the employee status
    if (userProfile?.defaultRole == 'EMPLOYEE') {
      const userId = userProfile._id;
      const obj = {
        userId,
        employeeStatus: EmployeeStatus.ACTIVE,
      };
      await firstValueFrom(this.userClient.send(UPDATE_USER, obj));
    } else {
      await firstValueFrom(
        this.userClient.send(GET_USER_EMAIL_TO_SET_PASSWORD, { email: userId })
      );
    }

    return response?.data;
  }

  @Post('forgot-password')
  @ApiDescription('Forgot Password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: ForgotPasswordResponseDto,
  })
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
    const response = await firstValueFrom(
      this.authClient.send(FORGOT_PASSWORD, dto)
    );
    return response;
  }

  @Post('confirm-forgot-password')
  @ApiDescription('Confirmed Forgot Password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: ConfirmForgotPasswordResponseDto,
  })
  async confirmForgotPassword(@Body() dto: ConfirmForgotPasswordRequestDto) {
    const response = await firstValueFrom(
      this.authClient.send(CONFIRM_FORGOT_PASSWORD, dto)
    );
    return response;
  }

  @Post('verification-update')
  @ApiDescription('IdentityGram Verification Webhook listener')
  @HttpCode(HttpStatus.OK)
  async verificationUpdate(@Body() dto: UpdateIdentitySessionDto) {
    const response = await firstValueFrom(
      this.userClient.send(VERIFICATION_UPDATE, { ...dto })
    );
    if (dto.status === VerificationStatusEnum.APPROVED) {
      const signupResponse = await firstValueFrom(
        this.authClient.send(SIGNUP, {
          ...dto,
        })
      );

      await firstValueFrom(
        this.userClient.send(UPDATE_USER, {
          userId: response?._id,
          password: signupResponse?.data?.hashedPassword,
          temporaryPassword: true,
        })
      );

      this.notification.emit(NOTIFICATION_PATTERNS.GENERAL.SIGNUP_SUCCESS, {
        userId: response?._id,
        firstName: response?.firstName,
        lastName: response?.lastName,
        email: response?.email,
        password: signupResponse?.data?.password,
        company: response?.allowedCompany?.[0] ?? COMPANIES.RECRUITMENT,
      });
    }
    return response;
  }
  @Post('change-password')
  @ApiRoute({
    name: 'Change Password',
    description: 'Change User Password',
  })
  @ApiDescription('Changed Password')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({
    type: ChangePasswordResponseDto,
  })
  async changePassword(
    @Req() request: Request,
    @Body() dto: ChangePasswordRequestDto
  ) {
    const accessToken = request.headers.authorization.replace('Bearer ', '');
    await firstValueFrom(
      this.authClient.send(CHANGE_PASSWORD, { accessToken, ...dto })
    );
    return null;
  }

  @Put('verify-password')
  @ApiRoute({
    name: 'account verify password',
    description: 'Account Verify Password',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: VerifyPasswordResponseDto,
  })
  async verifyPassword(@Body() dto: VerifyPasswordRequestDto) {
    const { user } = await firstValueFrom(this.authClient.send(SIGNIN, dto));
    return { userId: user?.userId };
  }

  // @Post('change-email')
  // @ApiRoute({
  //   name: 'Change Email',
  //   description: 'Change User Email',
  // })
  // @ApiDescription('Change User Email')
  // @ApiCreatedResponse({
  //   type: ChangeEmailResponseDto,
  // })
  // async changeEmail(@Req() { user }, @Body() dto: ChangeEmailRequestDto) {
  //   const passwordVerifiedUser = await firstValueFrom(
  //     this.authClient.send(SIGNIN, {
  //       email: user.email?.toLowerCase(),
  //       // password: dto.password,
  //     }),
  //   );
  //   if (user.email == dto.newEmail) {
  //     throw new BadRequestException('You already have the same email');
  //   }
  //   const checkEmail = await firstValueFrom(
  //     this.userClient.send(CHECK_EMAIL, {
  //       email: dto.newEmail?.toLowerCase(),
  //       sendData: true,
  //     }),
  //   );
  //   if (checkEmail && checkEmail._id != user.userId) {
  //     throw new ConflictException('Email Already Exists');
  //   }
  //   const verifiedUser = passwordVerifiedUser.user;
  //   verifiedUser.newEmail = dto.newEmail;
  //   const emailUpdatedOnCognito = await firstValueFrom(
  //     this.authClient.send(ADMIN_UPDATE_USER_EMAIL, { ...verifiedUser }),
  //   );
  //   return emailUpdatedOnCognito;
  // }

  // @Get('verify-change-email')
  // @ApiRoute({
  //   name: 'verify change email',
  //   description: 'Verifying Change Email',
  // })
  // @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //   type: VerifyEmailResponseDto,
  // })
  // async verifyChangeEmail(@Query('code') code: string, @Req() req) {
  //   const accessToken = req.headers.authorization.replace('Bearer ', '');
  //   const verifyEmail = await firstValueFrom(
  //     this.authClient.send(VERIFY_CHANGE_EMAIL, {
  //       code,
  //       accessToken,
  //     }),
  //   );
  //   if (verifyEmail) {
  //     const userData = await firstValueFrom(
  //       this.authClient.send(ADMIN_GET_USER, { userId: req.user.userId }),
  //     );
  //     await firstValueFrom(
  //       this.userClient.send(CHANGE_USER_EMAIL_ON_VERIFY, {
  //         userId: userData.data.userId,
  //         newEmail: userData.data.email,
  //       }),
  //     );
  //   }
  //   return verifyEmail;
  // }

  @Get('permissions')
  @ApiRoute({
    name: 'Retrieve Permissions',
    description: 'Retrieve Permissions',
    permission: '*',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: RetrievePermissionsResponseDto,
  })
  async getPermissions(@Req() { user: { userPermissions } }) {
    return userPermissions;
  }

  @Put('signout')
  @ApiRoute({
    name: 'account sign out',
    description: 'Account Sign out',
  })
  @ApiOkResponse({
    type: SignOutResponseDto,
  })
  async signout(@Req() { user, userProfile }) {
    if (userProfile.loggedInAs) {
      await firstValueFrom(
        this.userClient.send(LOG_IN_AS_EMPLOYEE, {
          userId: userProfile.loggedInAs,
          adminId: user.userId,
          activate: false,
          companyId: userProfile.companyId,
        })
      );
    }
    return null;
  }
}