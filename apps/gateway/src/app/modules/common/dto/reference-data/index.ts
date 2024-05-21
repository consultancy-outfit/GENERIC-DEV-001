import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from '@shared/dto';

export class ListReferenceDataResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Reference data fetched successfully' })
  message: string;
}

export * from './address-location.dto';
export * from './address.dto';
export * from './lookup.dto';
