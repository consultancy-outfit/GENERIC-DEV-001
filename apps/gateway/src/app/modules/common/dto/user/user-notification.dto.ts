import { Prop } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';
import { ApiResponseDto } from '@shared/dto';
import { Type } from 'class-transformer';

export class GetUserNotificationsDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      notifications: [
        {
          _id: '63932a024030be1571b01192',
          userId: '35121b85-6005-473d-afb9-1f3e3e3f42c1',
          type: 'assigned_initial_audits',
          title: 'Assigned initial audits',
          message:
            'Admin have assigned you new initial audits for you to audit',
          readAt: null,
          createdAt: '2022-12-09T12:28:50.037Z',
          updatedAt: '2022-12-09T12:28:50.037Z',
        },
      ],
      meta: {
        page: 1,
        pages: 1,
        limit: 100,
        total: 1,
      },
    },
  })
  data: any;

  @ApiProperty({ example: 'All Notifications' })
  message: string;
}
export class GetLatestUserNotificationsDto extends ApiResponseDto {
  @ApiProperty({
    example: {
      notifications: [
        {
          _id: '63932a024030be1571b01192',
          userId: '35121b85-6005-473d-afb9-1f3e3e3f42c1',
          type: 'assigned_initial_audits',
          title: 'Assigned initial audits',
          message:
            'Admin have assigned you new initial audits for you to audit',
          readAt: null,
          createdAt: '2022-12-09T12:28:50.037Z',
          updatedAt: '2022-12-09T12:28:50.037Z',
        },
      ],
    },
  })
  data: any;

  @ApiProperty({ example: 'All Notifications' })
  message: string;
}

export class ReadNotificationsRequest {
  @ApiProperty({
    example: ['6397571357a761784f53063f'],
    required: true,
  })
  @Type(() => String)
  @Prop({ type: [String], required: true })
  @IsArray()
  @IsNotEmpty()
  notificationIds: [string];
}
