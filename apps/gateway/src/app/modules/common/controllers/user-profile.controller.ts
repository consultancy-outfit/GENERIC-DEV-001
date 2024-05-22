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
import { ProfileImageDto, ViewProfileResponseDto } from '../dto/user';
import { firstValueFrom } from 'rxjs';
import { ApiDescription, ApiFormData, AuthN } from '@gateway/decorators';
import { MESSAGE_PATTERNS, SERVICES } from '@shared/constants';

const {
  USER: { UPDATE_PROFILE_IMAGE, REMOVE_PROFILE_IMAGE, GET_USER },
} = MESSAGE_PATTERNS.USER_ACCOUNT_PROFILE;

@ApiTags('User Profile')
@Controller('user-profile')
export class UserProfileController {
  protected readonly logger = new Logger(UserProfileController.name);

  constructor(
    @Inject(SERVICES.USER_ACCOUNT_PROFILE) private userAuthClient: ClientRMQ
  ) {}

  @AuthN()
  @Get()
  @ApiOkResponse({
    type: ViewProfileResponseDto,
  })
  async viewProfile(@Request() { user: { userId } }) {
    const data = await firstValueFrom(
      this.userAuthClient.send(GET_USER, {
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
      this.userAuthClient.send(GET_USER, { userId })
    );

    return data;
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
      this.userAuthClient.send(UPDATE_PROFILE_IMAGE, {
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
      this.userAuthClient.send(REMOVE_PROFILE_IMAGE, {
        userId: req.user.userId,
      })
    );

    return data;
  }
}
