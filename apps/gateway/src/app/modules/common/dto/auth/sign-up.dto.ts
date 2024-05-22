import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiResponseDto } from '@shared/dto';
import { Role } from '@shared/constants';

export class SignupRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'John' })
  firstName: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Doe' })
  lastName: string;
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
  @ApiProperty({ example: 'super_admin@yopmail.com' })
  email: string;

  @IsPhoneNumber(null, {
    message({ property }) {
      return `${property} is not valid .`;
    },
  })
  @IsOptional()
  @ApiProperty({ example: '+442071234567' })
  contactNumber: string;

  @IsEnum(Role)
  @IsOptional()
  @ApiProperty({ example: Role.USER })
  defaultRole: Role;
}

export class SignupResponseDto extends ApiResponseDto {
  @ApiProperty({
    default: {
      userId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
  })
  data: any;

  @ApiProperty({
    example: 'Signed up successfully. Kindly check your email address.',
  })
  message: string;
}
