import { ApiProperty } from '@nestjs/swagger';
import { COMPANIES, Gender } from '@shared/constants';
import { ApiResponseDto } from '@shared/dto';
import { Exclude } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEmployeeRequestDto {
  @ApiProperty({ example: 'Lily' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Evans' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'lily.evans@gmail.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+447975777666' })
  @IsOptional()
  @IsString()
  phoneNumber: string;

  @Exclude()
  companyId: string;

  @ApiProperty({ example: 'female', enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '124545' })
  @IsOptional()
  @IsString()
  employeeId: string;

  @ApiProperty({ example: 'harpermanson@gmail.com', required: true })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  workEmail: string;

  @ApiProperty({ example: '2023-10-15T08:55:43+0000', required: false })
  @IsOptional()
  @IsISO8601()
  employmentStartDate: string;

  @ApiProperty({ example: 'UI/UX designer' })
  @IsOptional()
  @IsString()
  employeeTitle: string;

  @ApiProperty({ example: '6530bb524bf631e7d96251eb' })
  @IsOptional()
  @IsString()
  department: string;

  @ApiProperty({ example: '6' })
  @IsOptional()
  @IsString()
  location: string;

  @ApiProperty({
    description: 'PERFORMANCE, ONBOARDING, RECRUITMENT',
    isArray: true,
    enum: COMPANIES,
    default: [COMPANIES.PERFORMANCE],
  })
  @IsOptional()
  @IsEnum(COMPANIES, { each: true })
  allowedCompany: COMPANIES[];
}

export class CreateEmployeeResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      _id: '652f8b9c911c35bf04d5e935',
      firstName: 'Lily',
      lastName: 'Evans',
      email: 'lily.evans@gmail.com',
      workEmail: 'harpermanson@gmail.com',
      gender: 'female',
      employeeId: '124545',
      employmentStartDate: '2023-10-15T08:55:43+0000',
      employeeTitle: 'UI/UX designer',
      department: '5',
      location: '6',
      isCompanyAdmin: false,
      isActive: true,
      userPermissions: [],
      verificationStatus: 'Not Started',
      allowedCompany: [],
      createdAt: '2023-10-18T07:39:08.115Z',
      updatedAt: '2023-10-18T07:39:08.115Z',
    },
  })
  data: any;
}
