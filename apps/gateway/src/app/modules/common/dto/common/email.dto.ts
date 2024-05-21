import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from '@shared/dto';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

interface IAttachment {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: string;
}

export class SendEmailDto {
  @ApiProperty({ type: String, example: '', required: false })
  @IsString()
  @IsOptional()
  from?: string;

  @ApiProperty({
    type: [String],
    example: ['test@mail.com'],
    required: true,
  })
  @IsNotEmpty()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : value.split(',').map((email: string) => email.trim())
  )
  @ArrayMinSize(1)
  @IsArray()
  @IsEmail({}, { each: true })
  recipients: string[];

  @ApiProperty({ type: [String], example: [''], required: false })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : value.split(',').map((email: string) => email.trim())
  )
  @IsArray()
  @IsEmail({}, { each: true })
  ccRecipients?: string[];

  @ApiProperty({ type: String, example: 'email subject', required: true })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ type: String, example: '', required: false })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ type: String, example: '', required: false })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Select attachment',
    required: false,
  })
  attachments?: Array<IAttachment>;
}

export class EmailParamDto {
  @ApiProperty({ example: '', required: false })
  @IsOptional()
  @IsDate()
  emailSendAt: Date;
}

export class EmailResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: 'Email Sent!',
  })
  data: any;
}
