import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { IUser } from '@gateway/interfaces';
import { ApiResponseDto } from '@shared/dto';

export class ListUsersRequestDto {}

export class ListUsersResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      users: [
        {
          _id: '9d40xxxxxxxx5',
          userId: '69277da3-db93-4cfd-beb4-7170ae7ae910',
          firstName: 'firstName',
          lastName: 'lastName',
          email: 'company_admin@yopmail.com',
          contactNumber: 442546314321,
          productTitle: 'DBS',
          termsAndConditions: true,
          defaultRole: 'COMPANY_ADMIN',
          isActive: false,
          profileImage:
            'users/69277da3-db93-4cfd-beb4-7170ae7ae910/profile/4758ba05-97ba-4076-a2ae-0c68cfab2a5c.jpg',
          createdAt: '2022-12-20T11:56:30.652Z',
          updatedAt: '2022-12-20T11:58:02.029Z',
        },
      ],
      meta: {
        page: 1,
        pages: 2,
        limit: 10,
        total: 17,
      },
    },
  })
  @IsArray()
  data: IUser[];
}
