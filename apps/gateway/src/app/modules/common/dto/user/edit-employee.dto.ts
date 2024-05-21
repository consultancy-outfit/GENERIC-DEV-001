import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsIn,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AddressDto } from './address.dto';
import {
  EmploymentStatus,
  Ethnicity,
  Gender,
  JobLevel,
  MaritalStatus,
  Pronouns,
  TimeZone,
} from '@shared/constants';
import { EmergencyContactDto } from './emergency-contact.dto';
import { Types } from 'mongoose';

export class UpdateUserProfileRequestDto {
  @ApiProperty({ example: 'Lily' })
  @IsString()
  @IsOptional()
  firstName: string;

  @ApiProperty({ example: 'Evans' })
  @IsString()
  @IsOptional()
  lastName: string;

  @IsOptional()
  @IsArray()
  @IsIn(Pronouns, { each: true })
  @ApiProperty({
    type: [String],
    required: false,
    enum: Pronouns,
    example: ['he'],
  })
  pronouns?: string[];

  @ApiProperty({ example: '+447975777666' })
  @IsOptional()
  @IsString()
  contactNumber: string;

  @ApiProperty({ example: 'female', enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender: string;

  @ApiProperty({ example: Ethnicity.AFRICAN, enum: Ethnicity })
  @IsOptional()
  @IsEnum(Ethnicity)
  ethnicity: string;

  @ApiProperty({ example: MaritalStatus.SINGLE, enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus: string;

  @ApiProperty({ example: '124545' })
  @IsOptional()
  @IsString()
  employeeId: string;

  @ApiProperty({ example: 'harpermanson@gmail.com', required: true })
  @IsOptional()
  @IsString()
  @IsEmail()
  workEmail?: string;

  @ApiProperty({ example: '2023-10-15', required: false })
  @IsOptional()
  @IsISO8601()
  dob: string;

  @ApiProperty({ example: 'Your bio', required: false })
  @IsOptional()
  about: string;

  @ApiProperty({ example: TimeZone.GMT, enum: TimeZone })
  @IsOptional()
  @IsEnum(TimeZone)
  timeZone: string;

  @ApiProperty({
    type: Types.ObjectId,
    example: 'ba4122a3-1ac8-4aaa-8994-dfe3455a18c9',
    required: false,
  })
  @IsOptional()
  @IsUUID(4)
  managerId: string;

  @ApiProperty({ example: '2023-10-15T08:55:43+0000', required: false })
  @IsOptional()
  @IsISO8601()
  employmentStartDate: string;

  @ApiProperty({ example: 'UI/UX designer' })
  @IsOptional()
  @IsString()
  employeeTitle: string;

  @ApiProperty({ example: new Types.ObjectId() })
  @IsOptional()
  @IsMongoId()
  department: string;

  @ApiProperty({ example: new Types.ObjectId() })
  @IsOptional()
  @IsMongoId()
  location: string;

  @ApiProperty({ example: EmploymentStatus.FULL_TIME, enum: EmploymentStatus })
  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus: string;

  @ApiProperty({ example: JobLevel.JUNIOR, enum: JobLevel })
  @IsOptional()
  @IsEnum(JobLevel)
  jobLevel: string;

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

  @IsOptional()
  @ApiProperty({
    type: EmergencyContactDto,
    required: false,
    example: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@gmail.com',
      phone: '+442071234567',
      relationship: 'sibling',
    },
  })
  emergencyContact?: EmergencyContactDto;

  @IsObject()
  @IsOptional()
  @ApiProperty({
    example: { '6557170271d510f13a3b41ad': 20, '65571882b6fceb8b402d0c40': 5 },
    description: 'Dynamic attribute',
    required: false,
  })
  attributeOptionIds?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ example: false, required: false, enum: [true, false] })
  allowPushNotification?: boolean;
}
