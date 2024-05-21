import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@shared/constants';
import { AuditLogService } from '../services/audit-log.service';
import { AuditLogListDto } from '../dto/audit-log.dto';

const { ADMIN_CREATE_LOG, ADMIN_GET_ALL_LOG, ADMIN_GET_RECENT_AUDIT_TRAIL } =
  MESSAGE_PATTERNS.USER_ACCOUNT.ADMIN_USER;

@Controller()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @EventPattern(ADMIN_CREATE_LOG)
  async createAuditLog(@Payload() payload: any): Promise<void> {
    await this.auditLogService.createAuditLog(payload);
  }

  @MessagePattern(ADMIN_GET_ALL_LOG)
  async auditLogList(@Payload() payload: AuditLogListDto) {
    return await this.auditLogService.getAuditLogsList(payload);
  }

  @MessagePattern(ADMIN_GET_RECENT_AUDIT_TRAIL)
  async getRecentAuditTrail() {
    return await this.auditLogService.getRecentAuditTrail();
  }
}
