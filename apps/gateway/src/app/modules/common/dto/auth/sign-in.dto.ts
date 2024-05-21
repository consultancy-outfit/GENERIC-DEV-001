import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';

export class SigninRequestDto {
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

  @IsNotEmpty()
  @ApiProperty({ example: 'PLib$$$786' })
  password: string;
}

export class SigninResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      authToken: 'eyJhbG.eyJzdWi.....yfQ.Sf6yJV_ad5c',
      refreshToken: 'exQhbG.enJzdWi.....yzQ.Sf6yJV_xd7N',
      expiresIn: 43200,
      user: {
        userId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        roles: ['EMPLOYEE'],
        email: 'email@gmail.com',
      },
    },
  })
  data: any;

  @ApiProperty({ example: 'Successfully logged in.' })
  message: string;
}
