import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddReminderRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'test' })
  label: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '2023-10-10T16:15:17.226+00:00' })
  dateAndTime: string;
}
