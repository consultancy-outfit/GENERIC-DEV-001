import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@shared/constants';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginateDto } from '../common/paginate.dto';
export class ListAuditLogDto extends PaginateDto {
  @ApiProperty({
    example: 'search string',
    required: false,
  })
  @IsString()
  @IsOptional()
  search: string;

  @ApiProperty({
    enum: Role,
    example: '',
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  accountType: string;
}
