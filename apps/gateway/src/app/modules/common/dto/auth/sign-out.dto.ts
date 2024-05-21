import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from '@shared/dto';

export class SignOutRequestDto {
  accessToken: string;
}

export class SignOutResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Successfully logged out.' })
  message: string;
}
