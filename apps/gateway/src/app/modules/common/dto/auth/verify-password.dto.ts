import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';

export class VerifyPasswordRequestDto {
  @IsNotEmpty()
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
  @ApiProperty({ example: 'client@yopmail.com' })
  email: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'PLib$$$786' })
  password: string;
}

export class VerifyPasswordResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      userId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
  })
  data: any;

  @ApiProperty({ example: 'Successfully verified password.' })
  message: string;
}
