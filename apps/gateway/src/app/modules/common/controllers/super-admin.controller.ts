import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ClientRMQ } from '@nestjs/microservices';
import { ApiDescription, ApiPagination, AuthN } from '@gateway/decorators';
import {
  ApiAcceptedResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  MESSAGE_PATTERNS,
  SERVICES,
  VerificationStatusEnum,
} from '@shared/constants';
import {
  // AddUserDto,
  CreateUserResponseDto,
  ListUsersResponseDto,
  UpdateSingleUserRequestDto,
  ParamIdDTO,
  StatusUserDTO,
  UpdateCompanyUserRequestDto,
  GetUserCountResponseDto,
  GetVerifiedProductCountDto,
  ViewProfileResponseDto,
  AdminAddUserDto,
} from '../dto/user';
import { firstValueFrom, timeout } from 'rxjs';
import {
  ForgotPasswordRequestDto,
  UpdateCompanyManagementUserRequestDto,
} from '../dto/auth';
import { AddReminderRequestDto } from '../dto/auth';
// import { ProductNameEnum } from '../../../interfaces/jobs';
import { EmailResponseDto, EmailParamDto, SendEmailDto } from '../dto/common';
import { CommonService } from '@shared';
import { FilesInterceptor } from '@nestjs/platform-express';

const {
  AUTH: { FORGOT_PASSWORD, SIGNUP },
  ADMIN_USER: {
    // ADMIN_CREATE_USER,
    ADMIN_USER_CHANGE_STATUS,
    ADMIN_GET_ALL_LOG,
    ADMIN_GET_RECENT_AUDIT_TRAIL,
    ADMIN_UPDATE_USER,
    GET_TOTAL_COUNT,
    GET_VERIFIED_PRODUCT_COUNT,
  },
} = MESSAGE_PATTERNS.USER_ACCOUNT_PROFILE;

const {
  USER: {
    CREATE_USER_DB,
    // LIST_ALL_USERS,
    CHANGE_USER_STATUS,
    GET_USER,
    UPDATE_USER,
    // LIST_COMPANY_USERS,
  },
} = MESSAGE_PATTERNS.USER_ACCOUNT_PROFILE;

const {
  ADMIN_ADD_REMINDER,
  ADMIN_GET_REMINDER,
  ADMIN_LIST_REMINDERS,
  LIST_CONNECTED_DEVICES,
} = MESSAGE_PATTERNS.USER_ACCOUNT_PROFILE.ADMIN_USER;

@ApiTags('Super Admin')
@Controller('super-admin')
export class SuperAdminController {
  protected readonly logger = new Logger(SuperAdminController.name);

  constructor(
    @Inject(SERVICES.USER_ACCOUNT_PROFILE) private userAuthClient: ClientRMQ,
    private commonService: CommonService
  ) {}

  @AuthN()
  @Post('add-user')
  @HttpCode(HttpStatus.CREATED)
  @ApiDescription('Admin Create User')
  @ApiCreatedResponse({
    type: CreateUserResponseDto,
  })
  async adminCreateUser(@Req() { user }, @Body() payload: AdminAddUserDto) {
    const { email, ...attributes } = payload;

    const { data } = await firstValueFrom(
      this.userAuthClient.send(SIGNUP, {
        email: email?.toLowerCase(),
      })
      // .pipe(timeout(10000))
    );
    // console.log(
    //   data,
    //   'SIGNUP',
    //   user,
    //   'user',
    //   'createdBy',
    //   data?.hashedPassword
    // );

    // AdminAddUserDto {
    //   firstName: 'Lily',
    //   lastName: 'Evans',
    //   email: 'lily.evans789@gmail.com',
    //   defaultRole: 'JOB_ADMIN'
    // } payload
    // {
    //   data: {
    //     userId: 'a6c828dc-d79f-422b-afc2-3867e46a76fe',
    //     password: '[L=naU$.HB',
    //     hashedPassword: '$2b$10$GA.BxOnh6B4xjAPGlQGdsO17XfJOFvZ6L5ehluY5i/VrUZEAE3HbS'
    //   },
    //   message: 'User Added Successfully, Credentials sent to provided email.',
    //   errors: null
    // }
    // SIGNUP
    //  {
    //   user: {
    //     _id: 'e5c23da0-ea2c-4f3c-8510-23d2b1874d11',
    //     userId: 'e5c23da0-ea2c-4f3c-8510-23d2b1874d11',
    //     email: 'YOSSARIANOUTFITLTD5455@yopmail.com',
    //     roles: [ 'COMPANY_ADMIN' ],
    //     temporaryPassword: false,
    //     iat: 1715152021,
    //     exp: 1715238421
    //   }
    // }
    // user 'e5c23da0-ea2c-4f3c-8510-23d2b1874d11'
    //  createdBy 'e5c23da0-ea2c-4f3c-8510-23d2b1874d11'

    await firstValueFrom(
      this.userAuthClient.send(CREATE_USER_DB, {
        _id: user?.data?.userId,
        password: data?.hashedPassword,
        temporaryPassword: true,
        email: email?.toLowerCase(),
        ...attributes,

        // createdBy,
      })
    );
    //console.log('=-=-=-=-=-=--=-=-', response, 'response');

    return data;
  }

  @Patch('system-admin/update-user/:userId')
  @ApiParam({
    name: 'userId',
    required: true,
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiDescription('Admin Update User')
  @ApiAcceptedResponse({
    type: UpdateSingleUserRequestDto,
  })
  async updateSingleUser(
    @Param('userId') userId: string,
    @Body() dto: AdminAddUserDto
  ) {
    const { email, ...data } = dto;

    const _userAccountData = await firstValueFrom(
      this.userAuthClient.send(ADMIN_UPDATE_USER, {
        userId,
        email,
      })
    );

    const response = await firstValueFrom(
      this.userAuthClient.send(UPDATE_USER, {
        userId,
        email,
        ...data,
      })
    );
    return response;
  }

  @AuthN()
  @Patch('system-admin/change-status')
  async changeStatusOfUser(@Body() body: StatusUserDTO) {
    const id = body.userId;
    const payload = { id, ...body };
    const data = await firstValueFrom(
      this.userAuthClient.send(CHANGE_USER_STATUS, payload)
    );

    const _cong = await firstValueFrom(
      this.userAuthClient.send(ADMIN_USER_CHANGE_STATUS, {
        isActive: data.isActive,
        userId: payload.userId,
      })
    );
    return data;
    // errors: null,
    // };
  }

  @AuthN()
  @Get('system-admin/get-details/:id')
  async getSingleUser(@Param() id: ParamIdDTO) {
    const payload = {
      userId: id?.id,
    };
    const user = await firstValueFrom(
      this.userAuthClient.send(GET_USER, payload)
    );
    return user;
  }
  // @AuthN()
  // @Patch('system-admin/change-status')
  // async changeStatusOfUser(@Body() body: StatusUserDTO) {
  //   const id = body.userId;
  //   const payload = { id, ...body };
  //    const data =  await firstValueFrom(
  //       this.userAuthClient.send(CHANGE_USER_STATUS, payload),
  //     )
  //    }

  @Post('reset-password')
  @ApiDescription('Admin Reset Password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: ForgotPasswordRequestDto,
  })
  async resetPassword(@Body() dto: ForgotPasswordRequestDto) {
    const response = await firstValueFrom(
      this.userAuthClient.send(FORGOT_PASSWORD, dto).pipe(timeout(5000))
    );
    return response;
  }

  //   const users = await firstValueFrom(
  //     this.userAuthClient.send(LIST_COMPANY_USERS, {
  //       // userId,
  //       search,
  //       limit,
  //       offset,
  //       status
  //       // role:roles[0]
  //     }).pipe(timeout(5000)),
  //   );
  //   return successResponse(users);
  // }

  @AuthN()
  @Patch('company-user/update-user/:userId')
  @ApiParam({
    name: 'userId',
    required: true,
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiAcceptedResponse({
    type: UpdateCompanyUserRequestDto,
  })
  async updateCompanyUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateCompanyUserRequestDto
  ) {
    const { email, ...data } = dto;
    const _userAccountData = await firstValueFrom(
      this.userAuthClient
        .send(ADMIN_UPDATE_USER, {
          userId,
          email,
        })
        .pipe(timeout(5000))
    );

    const { data: _userProfileData } = await firstValueFrom(
      this.userAuthClient
        .send(UPDATE_USER, {
          userId,
          ...data,
          email,
        })
        .pipe(timeout(5000))
    );
    return {
      message: 'User updated successfully.',
      errors: null,
    };
  }

  @Post('calender-add-reminder')
  @ApiDescription('calender-add-reminder')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Reminder Added Successfully',
  })
  async addReminder(@Body() dto: AddReminderRequestDto) {
    const reminder = await firstValueFrom(
      this.userAuthClient.send(ADMIN_ADD_REMINDER, dto)
    );

    return reminder;
  }

  @Get('calender-list-reminders/:month/:year')
  @ApiDescription('calender-list-reminders')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Success',
  })
  @ApiParam({
    name: 'month',
    required: true,
    example: 10,
  })
  @ApiParam({
    name: 'year',
    required: true,
    example: 2023,
  })
  async listReminders(
    @Param('month') month: number,
    @Param('year') year: number
  ) {
    const reminders = await firstValueFrom(
      this.userAuthClient.send(ADMIN_LIST_REMINDERS, {
        month,
        year,
      })
    );

    return reminders;
  }

  @Get('calender-get-reminder')
  @ApiDescription('calender-get-reminder')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Success',
  })
  @ApiQuery({
    name: 'date',
    type: String,
    required: true,
    example: '2023-10-10',
  })
  @ApiQuery({
    name: 'time',
    type: String,
    required: false,
    example: '16:15:17',
  })
  async getReminder(@Query('date') date: string, @Query('time') time: string) {
    const reminder = await firstValueFrom(
      this.userAuthClient.send(ADMIN_GET_REMINDER, {
        date,
        time,
      })
    );

    return reminder;
  }

  @Get('dashboard-list-connected-devices')
  @ApiDescription('dashboard-list-connected-devices')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Success',
  })
  @ApiQuery({
    name: 'accessToken',
    required: true,
    example:
      'eyJraWQiOiJIVGZ2T3hONmpVUHIzS1lKU0pqQkRKaW40VFhPa2pOcG1TVFpBVmNNUmtF',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'paginationToken',
    required: false,
    example: '',
  })
  async listConnectedDevices(
    @Query('accessToken') accessToken: string,
    @Query('limit') limit: number,
    @Query('paginationToken') paginationToken: string
  ) {
    const connectedDevices = await firstValueFrom(
      this.userAuthClient.send(LIST_CONNECTED_DEVICES, {
        accessToken,
        limit,
        paginationToken,
      })
    );

    return connectedDevices;
  }

  @Get('/total-user-count')
  @ApiOkResponse({
    type: GetUserCountResponseDto,
  })
  async userTotalCount() {
    return await this.userAuthClient.send(GET_TOTAL_COUNT, {});
  }
  @ApiOkResponse({
    type: GetVerifiedProductCountDto,
  })
  @Get('verified-products-count')
  async verifiedDocumentsCount() {
    return await this.userAuthClient.send(GET_VERIFIED_PRODUCT_COUNT, {
      // userId,
      // roles,
      // Im,
    });
  }

  @Post('send-email')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send Email' })
  @ApiOkResponse({ type: EmailResponseDto })
  public async sendEmail(
    @Query() param: EmailParamDto,
    @Body() payload: SendEmailDto,
    @UploadedFiles() attachments: any
  ): Promise<string> {
    let { emailSendAt } = param;
    const now = new Date();
    if (attachments) payload.attachments = attachments;

    if (emailSendAt) emailSendAt = new Date(emailSendAt);
    if (emailSendAt && emailSendAt > now) {
      return await this.commonService.scheduleMail(now, emailSendAt, payload);
    }
    // If no scheduling, send email immediately
    await this.commonService.sendMail(payload);
    return 'Email Sent!';
  }
}
