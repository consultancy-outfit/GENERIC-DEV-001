import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from '@shared/dto';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'eyJhbG.eyJzdWi.....g2h3qof1kw' })
  @IsString()
  refreshToken: string;
}

export class RefreshTokenResponse extends ApiResponseDto {
  @ApiProperty({
    example: {
      authToken: 'eyJhbG.eyJzdWi.....yfQ.Sf6yJV_ad5c',
      refreshToken: 'exQhbG.enJzdWi.....yzQ.Sf6yJV_xd7N',
      expiresIn: 43200,
    },
  })
  data: any;

  @ApiProperty({ example: 'Successfully logged in.' })
  message: string;
}
