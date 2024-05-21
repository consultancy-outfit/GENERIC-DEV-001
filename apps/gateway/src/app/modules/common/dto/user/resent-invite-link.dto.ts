import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';

export class ResentInviteLinkRequestDto {
  @ApiProperty({ example: 'xuzicrattaca-3227@yopmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResentInviteLinkResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: 'Invitation link resent successfully.',
  })
  @IsString()
  message: string;
}
