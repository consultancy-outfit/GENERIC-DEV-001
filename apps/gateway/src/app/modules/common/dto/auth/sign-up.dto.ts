import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiResponseDto } from '@shared/dto';
import { COMPANIES, CompanySize } from '@shared/constants';

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
  @IsNotEmpty()
  @ApiProperty({ example: '+442071234567' })
  contactNumber: string;
  @IsArray()
  @IsEnum(COMPANIES, { each: true })
  @ApiProperty({
    enum: COMPANIES,
    default: [COMPANIES.PERFORMANCE],
    isArray: true,
  })
  allowedCompany: COMPANIES[];
  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: 'Company Name is too long.' })
  @ApiProperty({ example: 'Orcalo' })
  companyName: string;
  @IsEnum(CompanySize)
  @IsNotEmpty()
  @ApiProperty({ enum: CompanySize })
  companySize: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Pakistan' })
  country: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Test111' })
  companyNo: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Test Address' })
  companyAddress: string;
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '50000' })
  postalCode: string;
}

export class SignupResponseDto extends ApiResponseDto {
  @ApiProperty({
    default: {
      userId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    },
  })
  data: any;

  @ApiProperty({
    example: 'User signed up successfully. Kindly check your email address.',
  })
  message: string;
}
