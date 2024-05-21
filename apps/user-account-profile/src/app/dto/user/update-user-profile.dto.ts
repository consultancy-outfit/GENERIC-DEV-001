export class UpdateUserProfileDto {
  id: string;
  pronouns?: string[];
  contactNumber?: string;
  dob?: Date;
  gender?: string;
  ethnicity?: string;
  maritalStatus?: string;
  about?: string;
  employmentStartDate?: Date;
  workEmail: string;
  timeZone?: string;
  employeeTitle?: string;
  department?: string;
  managerId?: string;
  location?: string;
  employmentStatus?: string;
  jobLevel?: string;
  address?: any;
  emergencyContact?: any;
  attributeOptionIds?: any;
  allowPushNotification?: boolean;
}
