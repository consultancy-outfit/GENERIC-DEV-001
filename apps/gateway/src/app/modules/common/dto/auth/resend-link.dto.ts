import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';

export class ResendLinkRequestDto {
  @IsNotEmpty()
  @ApiProperty({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' })
  userId: string;
}

export class ResendLinkResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Link is resent. Kindly check your email address.' })
  message: string;
}
