import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from '@shared/dto';

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
