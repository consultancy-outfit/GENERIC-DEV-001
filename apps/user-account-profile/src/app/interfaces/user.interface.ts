import { Types } from 'mongoose';
export interface IUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: number;
  companyId: Types.ObjectId | string;
  termsAndConditions: boolean;
  defaultRole: string;
}
