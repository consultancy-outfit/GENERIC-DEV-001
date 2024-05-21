import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';

export class ForgotPasswordRequestDto {
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
  @ApiProperty({ example: 'super_admin@yopmail.com', type: String })
  email: string;
}

export class ForgotPasswordResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Check your email to reset password.' })
  message: string;
}
