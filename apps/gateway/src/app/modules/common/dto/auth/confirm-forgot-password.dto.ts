import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';

export class ConfirmForgotPasswordRequestDto {
  @IsNotEmpty()
  @IsEmail()
  // @IsUUID(4)
  @ApiProperty({ example: 'test@yopmail.com' })
  email: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minUppercase: 1,
  })
  @IsNotEmpty()
  @ApiProperty({ example: 'PLib$$$786' })
  password: string;

  @IsNotEmpty()
  @ApiProperty({ example: '789124' })
  code: string;
}

export class ConfirmForgotPasswordResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Your password have been successfully changed.' })
  message: string;
}
