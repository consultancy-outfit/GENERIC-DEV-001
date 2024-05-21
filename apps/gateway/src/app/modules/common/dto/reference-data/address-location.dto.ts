import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from '@shared/dto';
import { IsString } from 'class-validator';

export class SearchAddressLocationsResponse extends ApiResponseDto {
  @ApiProperty({ example: 'Retrieved address locations successfully.' })
  @IsString()
  message: string;
}

export class GetAddressLocationResponse extends ApiResponseDto {
  @ApiProperty({ example: 'Retrieved address location successfully.' })
  @IsString()
  message: string;
}
