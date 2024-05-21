import { ApiProperty } from '@nestjs/swagger';
import { PaginateDto } from '../common/paginate.dto';
import { IsISO8601, IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';
import { Transform } from 'class-transformer';

export class BackupQueryDto {
  @ApiProperty({
    example: '63a32044f4df02ffb06b7e16',
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  backupId: string;
}

export class ListBackupDto extends PaginateDto {
  @ApiProperty({
    example: '2022-12-21',
    required: false,
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  date: string;
}

export class DeleteBackupDto {
  @ApiProperty({
    type: [String],
    example: ['652fd272d37762bc3122e796'],
    required: true,
  })
  @IsMongoId({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  backupIds: string | string[];
}

export class GetBackupResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      _id: '63a32455ba0798339282a853',
      file: 'backups/2022_12_21.zip',
      type: 'database',
      status: 'Success',
      createdAt: '2022-12-21T15:20:53.114Z',
      updatedAt: '2022-12-21T15:20:54.036Z',
    },
  })
  data: any;
}

export class GetBackupFileResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      url: '',
    },
  })
  data: any;
}

export class ListBackupResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      backups: [
        {
          _id: '63a32455ba0798339282a853',
          file: 'backups/2022_12_21.zip',
          type: 'database',
          status: 'Success',
          createdAt: '2022-12-21T15:20:53.114Z',
          updatedAt: '2022-12-21T15:20:54.036Z',
        },
      ],
      meta: {
        page: 1,
        pages: 1,
        limit: 100,
        total: 1,
      },
    },
  })
  data: any;
}
