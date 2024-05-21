import {
  VerificationDocumentEnum,
  VerificationStatusEnum,
} from '@shared/constants';
import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateIdentitySessionDto {
  @IsString()
  @ApiProperty({ example: 'string' })
  id: string;
  @IsString()
  @ApiProperty({ example: 'string' })
  integrationId: string;
  @ApiProperty({ enum: VerificationStatusEnum })
  @IsEnum(VerificationStatusEnum)
  status: VerificationStatusEnum;
  @ApiProperty({ example: 'string' })
  @IsString()
  uniqueIdentifier: string;
  @ApiProperty({ enum: VerificationDocumentEnum, required: false })
  @IsOptional()
  documentType?: VerificationDocumentEnum | null;
  @ApiProperty({ example: 'string' })
  @IsString()
  requestUrl: string;
  @ApiProperty({ example: false })
  @IsOptional()
  @IsBoolean()
  hasError?: boolean;
  @ApiProperty({ example: true })
  @IsBoolean()
  phoneNumberVerified: boolean;
  @ApiProperty({ example: 'string' })
  @IsString()
  verifiedPhoneNumber: string;
  @ApiProperty({ example: { url: 'string' } })
  @IsOptional()
  documentBack: { url: string };
  @ApiProperty({ example: { url: 'string' } })
  @IsOptional()
  documentFront: { url: string };
  @ApiProperty({
    example: {
      firstName: 'string',
      lastName: 'string',
      dateOfBirth: 'string',
      gender: 'string',
      idNumber: 'string',
      nationality: 'string',
      placeOfBirth: 'string',
      name: 'string',
      surname: 'string',
      expiration_date: 'string',
      address: 'string',
      country: 'string',
    },
  })
  @IsOptional()
  verificationDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    gender: string | null;
    idNumber: string | null;
    nationality: string | null;
    placeOfBirth: string | null;
    name: string | null;
    surname: string | null;
    expiration_date: string | null;
    address: string | null;
    country: string | null;
  };
  @ApiProperty({ example: 'string' })
  @IsOptional()
  reason: string | null;
}
