import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiResponseDto } from '@shared/dto';
import { Gender, Role } from '@shared/constants';
import { AddressDto } from './address.dto';
// import { Role } from '@shared/constants';
import { COMPANIES } from '@shared/constants';

export class AddUserDto {
  @ApiProperty({ example: 'Lily' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Evans' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'female', enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender: string;

  @ApiProperty({ example: '2023-10-15', required: false })
  @IsOptional()
  @IsISO8601()
  dob: string;
  @IsOptional()
  @ApiProperty({
    type: AddressDto,
    required: false,
    example: {
      addressLine: 'Model Town',
      city: 'Lahore',
      state: 'Punjab',
      country: 'Pakistan',
      zipCode: '54000',
    },
  })
  address?: AddressDto;
}

export class AdminAddUserDto {
  @ApiProperty({ example: 'Lily' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Evans' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'lily.evans@gmail.com' })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: Role.JOB_ADMIN, enum: Role })
  @IsNotEmpty()
  @IsEnum(Role)
  defaultRole: string;
}

export class CreateUserResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: 'User created successfully.',
  })
  @IsString()
  message: string;
}

export class UpdateCompanyUserRequestDto {
  @ApiProperty({ example: 'lily.evans@gmail.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
  @ApiProperty({ example: 'Lily' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Evans' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'Hycube' })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsArray()
  @IsEnum(COMPANIES, { each: true })
  @ApiProperty({
    enum: COMPANIES,
    default: [COMPANIES.PERFORMANCE],
    isArray: true,
  })
  allowedCompany: COMPANIES[];

  @ApiProperty({ example: true, enum: [true, false] })
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}

export class UpdateSingleUserRequestDto extends AddUserDto {}

export class ParamIdDTO {
  @ApiProperty({ example: 'Li4343ly...userId ' })
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class StatusUserDTO {
  @ApiProperty({ example: true, enum: [true, false] })
  @IsNotEmpty()
  @IsBoolean()
  status: boolean;

  @ApiProperty({ example: 'userId' })
  @IsNotEmpty()
  @IsString()
  userId: string;
}
export class GetUserCountResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      ActiveUsers: 40,
      InActiveUsers: 4,
      NewRequest: 1,
      Registeredcompany: 2,
    },
  })
  data: any;
}

export class GetVerifiedProductCountDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      seriesData: [70, 45, 65, 50, 50],

      categoriesData: [
        'PERFORMANCE',
        'ONBOARDING',
        'RECRUITMENT',
        'BUZZHR',
        'CLOCKLOG',
      ],
    },
  })
  data: any;
}
