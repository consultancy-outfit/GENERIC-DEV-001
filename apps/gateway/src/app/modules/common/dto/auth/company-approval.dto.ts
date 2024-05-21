import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CompanyApprovalRequestDto {
  @IsString()
  @ApiProperty({ example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' })
  userId: string;
}
