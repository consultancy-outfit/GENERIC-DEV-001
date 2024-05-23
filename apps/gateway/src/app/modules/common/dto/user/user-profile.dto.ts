import { ApiSingleFile } from '@gateway/decorators';
import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from '@shared/dto';

export class ProfileImageDto {
  @ApiSingleFile({ required: false })
  profileImage: any;
}

export class ViewProfileResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: 'Retrieved user profile successfully.',
  })
  message: string;
}

export class UpdatedUserProfileResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: 'Updated user profile successfully.',
  })
  message: string;
}
