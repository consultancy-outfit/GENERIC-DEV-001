import {
  User,
  UserSchema,
  AuditLogSchema,
  AuditLog,
  Backup,
  BackupSchema,
  NotificationSchema,
} from '../schemas';

export const ModelsProviders = [
  {
    name: AuditLog.name,
    schema: AuditLogSchema,
  },
  {
    name: User.name,
    schema: UserSchema,
  },
  {
    name: Backup.name,
    schema: BackupSchema,
  },
  { name: Notification.name, schema: NotificationSchema },
];
