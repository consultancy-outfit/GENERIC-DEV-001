import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';

export class VerifyTokenRequestDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'eyJhbG.eyJzdWi.....yfQ.Sf6yJV_ad5c' })
  accessToken: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'exQhbG.enJzdWi.....yzQ.Sf6yJV_xd7N' })
  idToken: string;
}

export class VerifyTokenResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      user: {
        userId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        roles: ['EMPLOYEE'],
        email: 'email@host.com',
      },
    },
  })
  data: any;

  @ApiProperty({ example: 'Successfully logged in.' })
  message: string;
}
