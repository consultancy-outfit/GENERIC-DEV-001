import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';

export class ChangeEmailRequestDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'test@yopmail.com' })
  oldEmail: string;

  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'testchanged@yopmail.com' })
  newEmail: string;
}

export class ChangeEmailResponseDto extends ApiResponseDto {
  @ApiProperty({
    example:
      'Your email has been successfully changed, you will receive email to confirm email.',
  })
  message: string;
}
