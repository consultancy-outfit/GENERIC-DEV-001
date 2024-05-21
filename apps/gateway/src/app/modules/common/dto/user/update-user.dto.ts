import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@shared/constants';
import { ApiResponseDto } from '@shared/dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateUserRequestDto {
  userId: string;

  @ApiProperty({ example: 'Lily' })
  firstName?: string;

  @ApiProperty({ example: 'Evans' })
  lastName?: string;

  @ApiProperty({ example: 'he' })
  pronouns?: string[];

  @ApiProperty({ example: 'example@gmail.com' })
  email?: string;

  @ApiProperty({ example: 'example@gmail.com' })
  verifiedPhoneNumber?: string;

  @ApiProperty({ example: '2022-07-06T19:08:36.670Z' })
  dob?: string;

  @ApiProperty({ example: 'male', enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ example: '+447975777666' })
  contactNumber?: string;
}

export class UpdateUserResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: 'User updated successfully.',
  })
  message: string;
}
