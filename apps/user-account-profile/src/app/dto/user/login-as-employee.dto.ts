import { Types } from 'mongoose';

export class LogInAsEmployeeDto {
  userId: string;
  adminId: string;
  activate: boolean;
  companyId: Types.ObjectId;
}
