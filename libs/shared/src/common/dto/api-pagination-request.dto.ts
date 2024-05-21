import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ApiPaginationRequestDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    required: false,
  })
  search?: string;

  @IsInt()
  @IsOptional()
  @ApiProperty({
    type: Number,
    default: 10,
    required: true,
  })
  limit: number;

  @IsInt()
  @IsOptional()
  @ApiProperty({
    type: Number,
    default: 0,
    required: true,
  })
  offset?: number;
}

export class SearchRequestDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    required: false,
  })
  search?: string;
}
