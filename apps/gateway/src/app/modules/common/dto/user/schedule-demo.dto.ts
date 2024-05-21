import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDate,
} from 'class-validator';

export class ScheduleADemoRequestDto {
  @ApiProperty({ example: '3a6d3b66-452a-43f9-8f4f-6f07604bda9f' })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ example: '2023-10-18T10:26:33.862+00:00' })
  @IsNotEmpty()
  @IsDate()
  demoDateAndTime: Date;

  @ApiProperty({ example: 'lily.evans@gmail.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jacob' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: ' https://zoom.us/j/5551112222' })
  @IsNotEmpty()
  @IsString()
  demoLink: string;

  @ApiProperty({ example: 'Demo invite' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  emailSubject: string;

  @ApiProperty({ example: 'writing message', required: true })
  @IsNotEmpty()
  @IsString()
  emailBody: string;
}
