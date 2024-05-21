import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';

export class VerifyEmailRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  code: string;
}

export class VerifyEmailResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: 'Your email address is verified successfully.',
  })
  message: string;
}
