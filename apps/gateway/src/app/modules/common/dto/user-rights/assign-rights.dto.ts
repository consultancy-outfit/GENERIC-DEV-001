import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiResponseDto } from '@shared/dto';

export class AssignRightsResponse extends ApiResponseDto {
  @ApiProperty({
    example: 'Rights have been assigned',
  })
  message: string;
}

export class AssignRightsDto {
  @ApiProperty({
    required: true,
    example: 'adeba046-4590-4728-82f2-ec03cdfeb7c6',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    required: true,
    example: [
      {
        permissionGroup: 'USERS',
        permissions: {
          list: { allowed: true },
          update: { allowed: false },
          delete: { allowed: true },
        },
      },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserRight)
  rights: [UserRight];
}

class UserRight {
  @IsNotEmpty()
  @IsString()
  permissionGroup: string;

  @IsNotEmpty()
  @IsObject()
  permissions: {
    list: { allowed: boolean };
    update: { allowed: boolean };
    delete: { allowed: boolean };
  };
}
