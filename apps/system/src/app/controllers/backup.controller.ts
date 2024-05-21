import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { BackupService } from '../services/backup.service';
import { MESSAGE_PATTERNS } from '@shared/constants';

const { ALL_BACKUPS, DELETE_BACKUP, GET_BACKUP, GET_BACKUP_FILE, NEW_BACKUP } =
  MESSAGE_PATTERNS.BACKUP;

@Controller()
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @MessagePattern('health-check')
  async healthCheck() {
    return {
      healthCheckPassed: true,
      healthCheck: 'Excellent',
    };
  }

  @EventPattern(NEW_BACKUP)
  async newBackup(): Promise<void> {
    await this.backupService.newBackup();
  }

  @MessagePattern(GET_BACKUP)
  async getBackup(@Payload() payload: { backupId: string }): Promise<any> {
    return await this.backupService.getBackup(payload);
  }

  @MessagePattern(GET_BACKUP_FILE)
  async getBackupFile(
    @Payload() payload: { backupId: string }
  ): Promise<string> {
    return await this.backupService.getBackupFile(payload);
  }

  @MessagePattern(ALL_BACKUPS)
  async getAllBackups(
    @Payload()
    payload: {
      date: string;
      offset: number;
      limit: number;
    }
  ): Promise<any> {
    return await this.backupService.getAllBackups(payload);
  }

  @MessagePattern(DELETE_BACKUP)
  async deleteBackup(
    @Payload() payload: { backupIds: [string] }
  ): Promise<void> {
    await this.backupService.deleteBackup(payload);
  }

  // @MessagePattern(GET_BACKUP_FILE)
  // async restoreBackup(payload: {backupId: string}) {
  //   await this.backupService.restoreFromS3(payload.backupId);
  // }
}
