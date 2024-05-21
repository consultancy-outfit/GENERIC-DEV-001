import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from '@shared/dto';

export class CountriesResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Countries fetched successfully' })
  message: string;
}

export class StatesResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'States fetched successfully' })
  message: string;
}

export class CitiesResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Cities fetched successfully' })
  message: string;
}
