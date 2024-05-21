import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class PaginateDto {
  @ApiProperty({
    default: 10,
    required: true,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  limit: number;

  @ApiProperty({
    default: 0,
    required: true,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  offset: number;
}
