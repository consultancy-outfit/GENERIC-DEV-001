import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsMongoId, IsEnum } from 'class-validator';
import { EmployeeStatus } from '@shared/constants';

export class DownloadCsvRequestDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    required: false,
    description: 'First name or Last name',
  })
  search: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  @ApiProperty({ type: String, enum: EmployeeStatus, required: false })
  employeeStatus: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false, description: 'Job title' })
  employeeTitle: string;

  @IsOptional()
  @IsMongoId()
  @ApiProperty({ type: String, required: false, description: 'department id' })
  department: string;
}
