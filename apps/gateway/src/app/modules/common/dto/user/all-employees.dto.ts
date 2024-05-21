import { IUser } from '@gateway/interfaces';
import { ApiPaginationRequestDto, ApiResponseDto } from '@shared/dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsArray,
  IsMongoId,
  IsEnum,
} from 'class-validator';
import { EmployeeStatus } from '@shared/constants';

export class ListEmployeesRequestDto extends ApiPaginationRequestDto {
  @ApiProperty({
    type: String,
    required: false,
    description: 'First name or Last name',
  })
  search: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  @ApiProperty({ type: String, enum: EmployeeStatus, required: false })
  employeeStatus: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ type: String, required: false, description: 'Job title' })
  employeeTitle: string;

  @IsOptional()
  @IsMongoId()
  @ApiProperty({ type: String, required: false, description: 'department id' })
  department: string;
}

export class ListEmployeesResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      employees: [
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
          employeeStatus: 'Invited',
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
