import { IUser } from '../../interfaces/user.interface';
import { Types } from 'mongoose';
export class CreateUserDto implements IUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: number;
  companyId: Types.ObjectId | string;
  termsAndConditions: boolean;
  defaultRole: string;
  profileImage: string;
}
