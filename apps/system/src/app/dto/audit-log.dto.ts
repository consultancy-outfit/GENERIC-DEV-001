export class AuditLogListDto {
  accountType?: string;
  search?: string;
  nextToken?: string;
  limit?: number;
  offset?: number;
}

export class AuditTrialRecentListDto {
  accountType?: string;
  search?: string;
}
