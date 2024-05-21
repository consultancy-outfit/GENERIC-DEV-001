import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from '@shared/dto';

export class GetAllRightsResponse extends ApiResponseDto {
  @ApiProperty({
    example: [
      {
        _id: '63xxxxxxxx2',
        permissionName: 'Users',
        permissionMethods: ['Create', 'List'],
        permissionGroup: 'Users',
        permissions: {
          list: {
            allowed: false,
            message: 'View Users details',
          },
          update: {
            allowed: false,
            message: 'Add/Edit Users details',
          },
          delete: {
            allowed: false,
            message: 'Delete Users details',
          },
        },
      },
    ],
  })
  data: string;
}
