import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';

export class ChangePasswordRequestDto {
  @IsString()
  @ApiProperty({ example: 'PLib$$$786' })
  oldPassword: string;

  @IsString()
  @ApiProperty({ example: 'PLib$$$786' })
  newPassword: string;
}
export class SetNewPasswordRequestDto {
  @IsEmail(
    {},
    {
      message({ property }) {
        if (property.toLowerCase() == 'email') {
          return 'Enter a valid email.';
        }
        return `${property} is not a valid email.`;
      },
    }
  )
  @IsNotEmpty()
  @ApiProperty({ example: 'test@yopmail.com' })
  email: string;
  @IsString()
  @ApiProperty({ example: 'PLib$$$786' })
  tempPassword: string;

  @IsString()
  @ApiProperty({ example: 'PLib$$$786' })
  newPassword: string;
}

export class ChangePasswordResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Your password has been successfully changed.' })
  message: string;
}
