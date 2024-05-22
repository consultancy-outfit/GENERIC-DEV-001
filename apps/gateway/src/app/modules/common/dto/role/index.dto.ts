import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from '@shared/dto';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class RoleRequestDto {
  @ApiProperty({ example: 'Manager' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example:
      'This role involves control over all basic activities in whole company.',
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    example: [],
  })
  @IsOptional()
  @IsArray()
  permissions: string[];
}

export class CreateRoleResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Role is created successfully.' })
  @IsNotEmpty()
  message: any;
}

export class UpdateRoleResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Role is updated successfully.' })
  @IsNotEmpty()
  message: any;
}

export class DeleteRoleResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Role is deleted successfully.' })
  @IsNotEmpty()
  message: any;
}

export class ListRolesResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Roles are retrieved successfully.' })
  @IsNotEmpty()
  message: any;
}

export class ListEmployeesByRoleResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Employees are retrieved successfully.' })
  @IsNotEmpty()
  message: any;
}

export class AddEmployeesToRoleRequestDto {
  @ApiProperty({
    type: [String],
    example: [
      'xxxxxxx-xxxx-xxxx-xxx-xxxxxxxx',
      'xxxxxxx-xxxx-xxxx-xxx-xxxxxxxx',
    ],
  })
  @IsUUID(4, { each: true })
  employeeIds: string[];
}
export class AddEmployeesToRoleResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Employees are added to the role successfully.' })
  @IsNotEmpty()
  message: string;
}

export class RemoveEmployeeFromRoleResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Employee is removed from the role successfully.' })
  @IsNotEmpty()
  message: any;
}
export class ViewRoleResponseDto extends ApiResponseDto {
  @ApiProperty({ example: 'Role is retrieved successfully.' })
  @IsNotEmpty()
  message: any;
}

export class UpdateRoleRequestDto {
  @ApiProperty({ example: 'Manager' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example:
      'This role involves control over all basic activities in whole company.',
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    example: [],
  })
  @IsOptional()
  @IsArray()
  permissions: string[];
}
