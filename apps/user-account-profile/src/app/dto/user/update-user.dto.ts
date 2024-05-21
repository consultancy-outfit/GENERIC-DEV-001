export class UpdateUserDto {
  userId: string;
  fcmtoken: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  profileImage?: string;
  dob?: string;
  aboutMe?: string;
  gender?: string;
  country?: string;
  city?: string;
  address?: string;
  languages?: [
    {
      languageName: string;
      proficiencyLevel: string;
    },
  ];
  profileCompletion?: {
    personalInfo: { required: boolean; percentage: number; completed: boolean };
    licenses: { required: boolean; percentage: number; completed: boolean };
    trainings: { required: boolean; percentage: number; completed: boolean };
    cuisines: { required: boolean; percentage: number; completed: boolean };
  };

  dbsCheck?: {
    status?: boolean;
    file?: string;
  };

  contractBookData?: {
    id: string;
    title: string;
    state: string;
    userId: string;
    parties: object;
    createdAt: Date;
    updatedAt: Date;
  };

  license?: {
    haveUTRNumber: boolean;
    UTRNumber: string;
    havePremisesPermission: boolean;
    premisesPermissionFile: string;
  };
}
