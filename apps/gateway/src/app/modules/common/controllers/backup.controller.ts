import { Controller, Get, Inject, Query, Logger, Delete } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ClientRMQ } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MESSAGE_PATTERNS, SERVICES } from '@shared/constants';
import {
  BackupQueryDto,
  DeleteBackupDto,
  GetBackupFileResponseDto,
  GetBackupResponseDto,
  ListBackupDto,
  ListBackupResponseDto,
} from '../dto/backup/backup.dto';
const { ALL_BACKUPS, DELETE_BACKUP, GET_BACKUP, GET_BACKUP_FILE, NEW_BACKUP } =
  MESSAGE_PATTERNS.BACKUP;
@ApiTags('Backup')
@Controller('backup')
export class BackupController {
  private readonly logger = new Logger(BackupController.name);
  constructor(@Inject(SERVICES.SYSTEM) private backupService: ClientRMQ) {}
  @Cron(CronExpression.EVERY_12_HOURS)
  async backupStarted() {
    this.logger.verbose('Backup Started');
    this.backupService.emit(NEW_BACKUP, {});
  }

  @Get('')
  @ApiOkResponse({ type: GetBackupResponseDto })
  async getBackup(@Query() param: BackupQueryDto) {
    return await firstValueFrom(this.backupService.send(GET_BACKUP, param));
  }

  @Get('file')
  @ApiOkResponse({ type: GetBackupFileResponseDto })
  async getBackupFile(@Query() param: BackupQueryDto) {
    return await firstValueFrom(
      this.backupService.send(GET_BACKUP_FILE, param)
    );
  }

  @Get('list')
  @ApiOkResponse({ type: ListBackupResponseDto })
  async getAllBackups(@Query() param: ListBackupDto) {
    return await firstValueFrom(this.backupService.send(ALL_BACKUPS, param));
  }

  @Delete('delete')
  async deleteBackup(@Query() param: DeleteBackupDto) {
    this.backupService.emit(DELETE_BACKUP, param);
    return null;
  }
}
