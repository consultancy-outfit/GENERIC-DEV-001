import { ApiProperty } from '@nestjs/swagger';
import { ApiResponseDto } from '@shared/dto';

export class RetrievePermissionsResponseDto extends ApiResponseDto {
  @ApiProperty({
    example: [
      'prf.module.1_on_1s.1_on_1s.delete',
      'prf.module.1_on_1s.1_on_1s.cancel',
      'prf.module.1_on_1s.templates.create',
      'prf.module.1_on_1s.templates.view',
      'prf.module.1_on_1s.templates.update',
      'prf.module.1_on_1s.templates.delete',
      'prf.module.1_on_1s.templates.duplicate',
      'prf.module.1_on_1s.for_team_members.create',
      'prf.module.1_on_1s.for_team_members.view',
      'prf.module.1_on_1s.for_team_members.update',
      'prf.module.1_on_1s.for_team_members.delete',
      'prf.module.1_on_1s.for_team_members.cancel',
      'prf.module.1_on_1s.for_all_employees.create',
      'prf.module.1_on_1s.for_all_employees.view',
      'prf.module.1_on_1s.for_all_employees.update',
    ],
  })
  data: any;

  @ApiProperty({ example: 'Retrieved permissions successfully.' })
  message: string;
}
