import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto {
  // @ApiProperty({
  //   nullable: true,
  //   default: 200,
  // })
  // statusCode: number;

  @ApiProperty({
    nullable: true,
    default: null,
  })
  data: any;

  @ApiProperty({
    nullable: true,
    example: 'Success',
  })
  message: string;

  @ApiProperty({
    nullable: true,
    default: null,
  })
  errors: string | object | null;
}
