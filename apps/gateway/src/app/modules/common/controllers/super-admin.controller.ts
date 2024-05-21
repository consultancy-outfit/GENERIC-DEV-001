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
  COMPANIES,
  MESSAGE_PATTERNS,
  SERVICES,
  VerificationStatusEnum,
  successResponse,
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
import { ListAuditLogDto } from '../dto/user/audit-log.dto';
import { AddReminderRequestDto } from '../dto/auth';
import { ScheduleADemoRequestDto } from '../dto/user/schedule-demo.dto';
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
} = MESSAGE_PATTERNS.USER_ACCOUNT;

const {
  USER: {
    SCHEDULE_A_DEMO,
    LIST_SCHEDULE_DEMOS,
    // CREATE_USER,
    // LIST_ALL_USERS,
    CHANGE_USER_STATUS,
    GET_USER,
    UPDATE_USER,
    ADMIN_ADD_USER_DB,
    LIST_SYSTEM_ADMIN_USERS,
    GET_ADMIN_USER,
    UPDATE_WITH_COMPANY_USER,
    DROPDOWN_LIST_SYSTEM_ADMIN_USERS,
    // LIST_COMPANY_USERS,
  },
  COMPANY: { UPDATE_COMPANY },
} = MESSAGE_PATTERNS.USER_PROFILE;

const { GET_COMPANIES } = MESSAGE_PATTERNS.COMPANIES;

const {
  ADMIN_ADD_REMINDER,
  ADMIN_GET_REMINDER,
  ADMIN_LIST_REMINDERS,
  LIST_CONNECTED_DEVICES,
} = MESSAGE_PATTERNS.USER_ACCOUNT.ADMIN_USER;

@ApiTags('Super Admin')
@Controller('super-admin')
export class SuperAdminController {
  protected readonly logger = new Logger(SuperAdminController.name);

  constructor(
    @Inject(SERVICES.USER_ACCOUNT) private adminAuthClient: ClientRMQ,
    @Inject(SERVICES.USER_PROFILE) private userClient: ClientRMQ,
    @Inject(SERVICES.SYSTEM) private systemClient: ClientRMQ,
    private commonService: CommonService
  ) {}

  @AuthN()
  @Post('add-user')
  @HttpCode(HttpStatus.CREATED)
  @ApiDescription('Admin Create User')
  @ApiCreatedResponse({
    type: CreateUserResponseDto,
  })
  async adminCreateUser(
    @Req() { user },
    @Req() { userProfile: { companyId } },
    @Body() payload: AdminAddUserDto
  ) {
    const { email, ...attributes } = payload;

    const { data } = await firstValueFrom(
      this.adminAuthClient.send(SIGNUP, {
        email: email?.toLowerCase(),
      })
      // .pipe(timeout(10000))
    );
    // console.log(
    //   data,
    //   'SIGNUP',
    //   user,
    //   'user',
    //   companyId,
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
      this.userClient.send(ADMIN_ADD_USER_DB, {
        _id: user?.data?.userId,
        password: data?.hashedPassword,
        temporaryPassword: true,
        companyId,
        email: email?.toLowerCase(),
        ...attributes,

        // createdBy,
      })
    );
    //console.log('=-=-=-=-=-=--=-=-', response, 'response');

    return data;
  }

  @Post('user-schedule-demo')
  async scheduleADemo(@Body() payload: ScheduleADemoRequestDto) {
    const { id, demoDateAndTime, demoLink } = payload;

    const data = await firstValueFrom(
      this.userClient.send(SCHEDULE_A_DEMO, {
        id,
        demoDateAndTime,
        demoLink,
      })
    );

    return data;
  }

  @Get('list-schedule-demos/:month/:year')
  @ApiDescription('list-schedule-demos')
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
  async listScheduleDemos(
    @Param('month') month: number,
    @Param('year') year: number
  ) {
    const demos = await firstValueFrom(
      this.userClient.send(LIST_SCHEDULE_DEMOS, {
        month,
        year,
      })
    );

    return demos;
  }
  @AuthN()
  @Get('system-admin/get-all-users')
  // @ApiRoute({
  //   name: 'Users',
  //   description: 'Get All User',
  //   permission: "view_users",
  // })
  @ApiQuery({
    name: 'status',
    type: 'boolean',
    required: false,
  })
  @ApiPagination('First name, Last name')
  @ApiOkResponse({
    type: ListUsersResponseDto,
  })
  @ApiQuery({
    name: 'companyUser',
    type: 'boolean',
    required: false,
  })
  async listAllUsers(
    @Req() { user: { userId } },
    @Query('search') search: string,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @Query('status') status: string,
    @Query('companyUser') companyUser: string
  ) {
    const users = await firstValueFrom(
      this.userClient
        .send(LIST_SYSTEM_ADMIN_USERS, {
          userId,
          search,
          limit,
          offset,
          status,
          companyUser,
          // role:roles[0]
        })
        .pipe(timeout(5000))
    );
    return users;
  }
  ////////////////////////////////////////////////////////////// Dropdown List System Admin Users ///////////////////////////////////////
  // @AuthN()
  @Get('system-admin/dropdown-get-all-users')
  @ApiOkResponse({
    type: ListUsersResponseDto,
  })
  @ApiQuery({
    name: 'search',
    required: false,
  })
  async dropdownListAllUser(
    // @Req() { user: { userId } },
    @Query('search') search: string
  ) {
    const users = await firstValueFrom(
      this.userClient
        .send(DROPDOWN_LIST_SYSTEM_ADMIN_USERS, {
          // userId,
          search,
        })
        .pipe(timeout(5000))
    );
    return users;
  }
  /////////////////////////////////////////////////////////////////

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
      this.adminAuthClient.send(ADMIN_UPDATE_USER, {
        userId,
        email,
      })
    );

    const response = await firstValueFrom(
      this.userClient.send(UPDATE_USER, {
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
      this.userClient.send(CHANGE_USER_STATUS, payload)
    );

    const _cong = await firstValueFrom(
      this.adminAuthClient.send(ADMIN_USER_CHANGE_STATUS, {
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
    const user = await firstValueFrom(this.userClient.send(GET_USER, payload));
    return user;
  }
  // @AuthN()
  // @Patch('system-admin/change-status')
  // async changeStatusOfUser(@Body() body: StatusUserDTO) {
  //   const id = body.userId;
  //   const payload = { id, ...body };
  //    const data =  await firstValueFrom(
  //       this.userClient.send(CHANGE_USER_STATUS, payload),
  //     )
  //    }

  @AuthN()
  @Get('audit-logs')
  @ApiDescription('Get All Audit Log')
  @HttpCode(HttpStatus.OK)
  async getAllAuditLogs(@Query() query: ListAuditLogDto) {
    return await firstValueFrom(
      this.systemClient.send(ADMIN_GET_ALL_LOG, query).pipe(timeout(10000))
    );
  }

  @AuthN()
  @Get('audit-trail-recent-activities')
  @ApiDescription('Get recent activities Audit Trail')
  @HttpCode(HttpStatus.OK)
  async getRecentAuditTrail() {
    return await firstValueFrom(
      this.systemClient
        .send(ADMIN_GET_RECENT_AUDIT_TRAIL, {})
        .pipe(timeout(10000))
    );
  }

  @Post('reset-password')
  @ApiDescription('Admin Reset Password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: ForgotPasswordRequestDto,
  })
  async resetPassword(@Body() dto: ForgotPasswordRequestDto) {
    const response = await firstValueFrom(
      this.adminAuthClient.send(FORGOT_PASSWORD, dto).pipe(timeout(5000))
    );
    return successResponse(response);
  }

  @Get('company-user/get-all-users')
  // @AuthN()
  // @ApiRoute({
  //   name: 'Users',
  //   description: 'Get All User',
  //   permission: "view_users",
  // })
  @ApiQuery({
    name: 'productName',
    enum: COMPANIES,
    example: COMPANIES,
    required: false,
  })
  @ApiQuery({
    name: 'verificationStatus',
    enum: VerificationStatusEnum,
    example: VerificationStatusEnum,
    required: false,
  })
  @ApiQuery({
    name: 'companyRegistered',
    type: 'boolean',
    required: false,
  })
  @ApiPagination('First name, Last name, Business name')
  @ApiOkResponse({
    type: ListUsersResponseDto,
  })
  async listCompanyUsers(
    // @Req() { user: { userId } },
    @Query('productName') productName: string,
    @Query('search') search: string,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @Query('companyRegistered') companyRegistered: boolean,
    @Query('verificationStatus') verificationStatus: string
  ) {
    try {
      const data = await firstValueFrom(
        this.userClient.send(GET_COMPANIES, {
          search,
          companyRegistered,
          limit,
          offset,
          productName,
          verificationStatus,
        })
      );

      return data;
    } catch (error) {
      throw Error(error);
    }
  }

  //   const users = await firstValueFrom(
  //     this.userClient.send(LIST_COMPANY_USERS, {
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
      this.adminAuthClient
        .send(ADMIN_UPDATE_USER, {
          userId,
          email,
        })
        .pipe(timeout(5000))
    );

    const { data: _userProfileData } = await firstValueFrom(
      this.userClient
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
      this.adminAuthClient.send(ADMIN_ADD_REMINDER, dto)
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
      this.adminAuthClient.send(ADMIN_LIST_REMINDERS, {
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
      this.adminAuthClient.send(ADMIN_GET_REMINDER, {
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
      this.adminAuthClient.send(LIST_CONNECTED_DEVICES, {
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
    return await this.adminAuthClient.send(GET_TOTAL_COUNT, {});
  }
  @ApiOkResponse({
    type: GetVerifiedProductCountDto,
  })
  @Get('verified-products-count')
  async verifiedDocumentsCount() {
    return await this.adminAuthClient.send(GET_VERIFIED_PRODUCT_COUNT, {
      // userId,
      // roles,
      // Im,
    });
  }

  @AuthN()
  @Get('view-profile')
  @ApiOkResponse({
    type: ViewProfileResponseDto,
  })
  async viewProfile(@Req() { user: { userId } }) {
    const data = await firstValueFrom(
      this.userClient.send(GET_ADMIN_USER, {
        userId,
      })
    );

    return data;
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

  @Patch('company-management/update-user/:userId')
  @ApiParam({
    name: 'userId',
    required: true,
  })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiDescription('Admin Update Company Management User')
  @ApiAcceptedResponse({
    type: UpdateSingleUserRequestDto,
  })
  async updateCompanyManagementUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateCompanyManagementUserRequestDto
  ) {
    const response = await firstValueFrom(
      this.userClient.send(UPDATE_WITH_COMPANY_USER, {
        ...dto,
        userId,
      })
    );
    await firstValueFrom(
      this.userClient.send(UPDATE_COMPANY, {
        ...dto,
        companyId: response.companyId,
      })
    );
    return response;
  }
}
