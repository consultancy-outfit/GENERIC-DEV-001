import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Put,
  Request,
  Patch,
  UploadedFile,
  Delete,
  Param,
} from '@nestjs/common';
import { ClientRMQ } from '@nestjs/microservices';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  CoverImageDto,
  ProfileImageDto,
  UpdateUserProfileRequestDto,
  UpdatedUserProfileResponseDto,
  ViewProfileResponseDto,
} from '../dto/user';
import { firstValueFrom } from 'rxjs';
import {
  ApiDescription,
  ApiFormData,
  AuthN,
  MyTeamAccess,
} from '@gateway/decorators';
import { MESSAGE_PATTERNS, SERVICES } from '@shared/constants';

const {
  USER: {
    UPDATE_USER_PROFILE,
    UPDATE_PROFILE_IMAGE,
    REMOVE_PROFILE_IMAGE,
    UPDATE_COVER_IMAGE,
    REMOVE_COVER_IMAGE,
    GET_USER,
  },
} = MESSAGE_PATTERNS.USER_PROFILE;

@ApiTags('User Profile')
@Controller('user-profile')
export class UserProfileController {
  protected readonly logger = new Logger(UserProfileController.name);

  constructor(
    @Inject(SERVICES.USER_PROFILE) private userClient: ClientRMQ,
    @Inject(SERVICES.USER_ACCOUNT) private authClient: ClientRMQ
  ) {}

  @AuthN()
  @Get()
  @MyTeamAccess()
  @ApiOkResponse({
    type: ViewProfileResponseDto,
  })
  async viewProfile(@Request() { user: { userId } }) {
    const data = await firstValueFrom(
      this.userClient.send(GET_USER, {
        userId,
        detailed: true,
      })
    );

    return data;
  }

  @AuthN()
  @Get(':id')
  @ApiOkResponse({
    type: ViewProfileResponseDto,
  })
  async viewEmployeeProfile(@Param('id') userId: string) {
    const data = await firstValueFrom(
      this.userClient.send(GET_USER, { userId })
    );

    return data;
  }

  @AuthN()
  @Patch()
  @ApiDescription('Update Profile')
  @ApiOkResponse({
    type: UpdatedUserProfileResponseDto,
  })
  async updateProfile(
    @Request() { user: { userId } },
    @Body() payload: UpdateUserProfileRequestDto
  ) {
    return await firstValueFrom(
      this.userClient.send(UPDATE_USER_PROFILE, { id: userId, ...payload })
    );
  }

  @AuthN()
  @Put('profile-image')
  @ApiFormData({
    single: true,
    fieldName: 'profileImage',
    fileTypes: ['png', 'jpeg', 'jpg'],
    errorMessage: 'Invalid image file entered.',
  })
  @ApiCreatedResponse({})
  @ApiDescription('Update Profile Image')
  async updateProfileImage(
    @Request() req,
    @Body() dto: ProfileImageDto,
    @UploadedFile() profileImage: any //Express.Multer.File,
  ) {
    const data = await firstValueFrom(
      this.userClient.send(UPDATE_PROFILE_IMAGE, {
        userId: req.user.userId,
        image: profileImage,
      })
    );

    return data;
  }

  @AuthN()
  @Delete('profile-image')
  @ApiCreatedResponse({})
  @ApiDescription('Remove Profile Image')
  async removeProfileImage(@Request() req) {
    const data = await firstValueFrom(
      this.userClient.send(REMOVE_PROFILE_IMAGE, {
        userId: req.user.userId,
      })
    );

    return data;
  }

  @AuthN()
  @Put('cover-image')
  @ApiFormData({
    single: true,
    fieldName: 'coverImage',
    fileTypes: ['png', 'jpeg', 'jpg'],
    errorMessage: 'Invalid image file entered.',
  })
  @ApiCreatedResponse({})
  @ApiDescription('Update Cover Image')
  async updateCoverImage(
    @Request() req,
    @Body() dto: CoverImageDto,
    @UploadedFile() coverImage: any //Express.Multer.File,
  ) {
    const data = await firstValueFrom(
      this.userClient.send(UPDATE_COVER_IMAGE, {
        userId: req.user.userId,
        image: coverImage,
      })
    );
    return data;
  }

  @AuthN()
  @Delete('cover-image')
  @ApiCreatedResponse({})
  @ApiDescription('Remove Cover Image')
  async removeCoverImage(@Request() req) {
    const data = await firstValueFrom(
      this.userClient.send(REMOVE_COVER_IMAGE, {
        userId: req.user.userId,
      })
    );

    return data;
  }

  // @ApiCreatedResponse({
  //   type: UpdateUserResponseDto,
  // })
  // @Patch('update')
  // @AuthN()
  // async update(
  //   @Req() { user: { userId, roles } },
  //   @Body() dto: UpdateUserRequestDto
  // ) {
  //   // const cmpId = userId;
  //   dto.userId = userId;

  //   if (roles[0] === 'COMPANY_ADMIN') {
  //     const userUpdate = await firstValueFrom(
  //       this.userClient.send(UPDATE_USER, dto)
  //     );

  //     // const getCompanyObj = {
  //     //   companyId: userUpdate.companyId,
  //     // };

  //     const companyName = await firstValueFrom(
  //       this.authClient.send(GET_COMPANY, { companyId: userUpdate.companyId })
  //     );

  //     delete companyName[0]._id;

  //     return {
  //       message: 'User updated successfully.',
  //       data: {
  //         ...userUpdate,
  //         ...companyName[0],
  //       },
  //       errors: null,
  //     };
  //   } else {
  //     const userUpdate = await firstValueFrom(
  //       this.userClient.send(UPDATE_USER, dto)
  //     );
  //     return {
  //       message: 'User updated successfully.',
  //       data: {
  //         ...userUpdate,
  //       },
  //       errors: null,
  //     };
  //   }
  // }
}
