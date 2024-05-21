export class AssignRightsDto {
  userId: string;
  rights: [UserRight];
}

export class UserRight {
  permissionGroup: string;
  permissions: {
    list: { allowed: boolean };
    update: { allowed: boolean };
    delete: { allowed: boolean };
  };
}

export class UserCountDto {
  userId: string;
  roles: string;
}
