export interface IUser {
  userId: string;
  email: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  dob?: string;
  gender?: string;
  country?: string;
  city?: string;
  address?: string;
  isActive?: boolean;
  isHostConfirmed?: boolean;
  languages?: [
    {
      languageName: string;
      proficiencyLevel: string;
    },
  ];
  defaultRole: string;
}
