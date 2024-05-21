import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class PermittedFeedbackTypesDto {
  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  PUBLIC?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  PRIVATE?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  MANAGER?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  PRIVATE_AND_MANAGER?: boolean;
}
