import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';

export class RemoveRoleRequestDto {
  @ApiProperty({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' })
  @IsString()
  @IsNotEmpty()
  userId: string;
  @ApiProperty({ example: 'EMPLOYEE' })
  @IsNotEmpty()
  @IsString()
  role: string;
}

export class RemoveRoleResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Role removed successfully.' })
  message: string;
}
