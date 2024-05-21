import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { S3Service } from '@shared';
import { BackupRepository } from '@shared/repository';
import { spawn } from 'child_process';
import fs, { readFileSync } from 'fs';
import { Types } from 'mongoose';
// import path from 'path';
@Injectable()
export class BackupService {
  private readonly mongoPath = process.env.MONGO_DSN;
  private readonly mongoDb = process.env.MONGO_DATABASE;
  private readonly logger = new Logger(BackupService.name);
  constructor(
    private backupRepo: BackupRepository,
    private s3: S3Service
  ) {}

  private backupPathName(): string {
    const date = new Date();
    const day =
      date.getUTCDate() > 9 ? date.getUTCDate() : '0' + date.getUTCDate();
    let month: string | number = date.getUTCMonth() + 1;
    month = month > 9 ? month : '0' + month;
    let hour: string | number = date.getHours();
    hour = hour > 9 ? hour : '0' + hour;
    return `${date.getUTCFullYear()}_${month}_${day}_${hour}.zip`;
  }

  private backupOptions(path: string): Array<string> {
    return [
      `--uri=${this.mongoPath}/${this.mongoDb}`,
      '--forceTableScan',
      `--archive=${path}`,
      '--gzip',
      '--excludeCollection=auditlogs',
    ];
  }

  async newBackup(): Promise<void> {
    Logger.verbose('BACKUP Started');
    const backup: any = await this.backupRepo.create({
      status: 'Started',
      type: 'database',
      file: 'path',
    });
    try {
      const path = this.backupPathName();
      const options = this.backupOptions(path);
      try {
        const backupProcess = spawn('mongodump', options);
        backupProcess.on('exit', async (code, signal) => {
          if (code || signal) {
            await this.backupRepo.findOneAndUpdate(
              { _id: backup._id },
              { status: 'Failed' }
            );
            const msg = code ? code : signal;
            this.logger.error(`Backup exited ${msg}`);
          } else {
            await this.backupToS3(path, backup._id);
            this.logger.verbose('Backup uploaded');
          }
        });
      } catch (err) {
        await this.backupRepo.findOneAndUpdate(
          { _id: backup._id },
          { status: 'Failed', reason: err.message }
        );
        this.logger.error(`Backup exited ${err.message}`);
      }
    } catch (err) {
      await this.backupRepo.findOneAndUpdate(
        { _id: backup._id },
        { status: 'Failed', reason: err.message }
      );
      this.logger.error(`Backup exited ${err.message}`);
    }
  }

  async getBackup(payload: { backupId: string }): Promise<any> {
    try {
      const { backupId } = payload;
      return await this.backupRepo.findOne({ _id: backupId });
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async getBackupFile(payload: { backupId: string }): Promise<string> {
    try {
      const { backupId } = payload;
      const backup = await this.backupRepo.findOne({ _id: backupId });
      try {
        return await this.s3.getSignedUrl(backup?.file);
      } catch (e) {
        throw new RpcException(e.message);
      }
    } catch (err) {
      throw new RpcException(err.message);
    }
  }

  async getAllBackups(payload: {
    offset: number;
    limit: number;
    date?: string;
  }): Promise<any> {
    try {
      const { date, offset, limit } = payload;
      let filters: any = {};
      if (date) {
        filters = {
          $and: [
            { createdAt: { $gte: new Date(date + 'T00:00:00.000Z') } },
            { createdAt: { $lt: new Date(date + 'T23:59:59.000Z') } },
          ],
        };
      }
      return await this.backupRepo.paginate({
        filterQuery: filters,
        offset,
        limit,
        returnKey: 'backups',
        pipelines: [],
      });
    } catch (err) {
      throw new RpcException(err);
    }
  }

  async deleteBackup(payload: { backupIds: [string] }): Promise<void> {
    try {
      const { backupIds } = payload;
      await this.backupRepo.deleteMany({ _id: { $in: backupIds } }, backupIds);
    } catch (err) {
      throw new RpcException(err);
    }
  }

  private async backupToS3(
    path: string,
    backupId: string | Types.ObjectId
  ): Promise<void> {
    const backupFile = readFileSync(path);
    const file = await this.s3.uploadFile(backupFile, `backups/${path}`, false);
    await this.backupRepo.findOneAndUpdate(
      { _id: backupId },
      { status: 'Success', file: file.url }
    );
    fs.unlinkSync(path);
  }

  // private restoreOptions(path: string): Array<string> {
  //   return [
  //     `--uri=${this.mongoPath}/${this.mongoDb}`,
  //     `--archive=${path}`,
  //     '--gzip',
  //   ];
  // }

  // async restoreFromS3(backupId: string): Promise<void> {
  //     const backup = await this.backupRepo.findOne({ _id: backupId });
  //     if (!backup) return;

  //     const file = await this.s3.getFileStream(backup.file);
  //     if (!file) return;

  //     let filename: any = backup.file.split('/');
  //     filename = filename[filename.length - 1];
  //     const writeStream = fs.createWriteStream(path.join('./', filename));
  //     const stream = file.pipe(writeStream);
  //     stream.on('finish', () => {
  //         try {
  //             let restoreProcess = spawn('mongorestore', this.restoreOptions(filename));
  //             restoreProcess.on('exit', async (code, signal) => {
  //                 if (code || signal) {
  //                     throw new RpcException('mongodump exited with code ' + code)
  //                 }
  //             });
  //         } catch (err) {
  //             throw new RpcException('Restore process couldn\'t be completed due to, ' + err.message)
  //         }
  //     })
  // }
}
