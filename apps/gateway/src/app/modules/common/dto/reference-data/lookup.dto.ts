import { ApiArrayProperty } from '@gateway/decorators';
import { ApiProperty } from '@nestjs/swagger';
import {
  FilterableFields,
  IncludableFields,
  LookupTypes,
  ResourceTypes,
} from '@shared/constants';
import { ApiResponseDto } from '@shared/dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

const PossibleTypes = {
  ...LookupTypes,
  ...ResourceTypes,
};

export class LookupRequestDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    type: String,
    required: false,
  })
  search?: string;

  @IsEnum(PossibleTypes)
  @IsOptional()
  @ApiProperty({
    type: String,
    required: true,
    enum: PossibleTypes,
  })
  type: LookupTypes | ResourceTypes;

  @IsEnum(FilterableFields, { each: true })
  @IsOptional()
  @ApiArrayProperty({
    name: 'filterFields',
    required: false,
    enum: FilterableFields,
  })
  filterFields?: typeof FilterableFields;

  @IsOptional()
  @ApiArrayProperty({
    name: 'filterValues',
    required: false,
  })
  filterValues?: string[];

  @IsEnum(IncludableFields, { each: true })
  @IsOptional()
  @ApiArrayProperty({
    name: 'includeFields',
    required: false,
    enum: IncludableFields,
  })
  includeFields?: string[];
}

export class LookupResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Lookup ran successfully' })
  message: string;
}
