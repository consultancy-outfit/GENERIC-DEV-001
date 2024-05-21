import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import dayjs, { Dayjs } from 'dayjs';
import type { ISendMailOptions } from '@nestjs-modules/mailer';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { v4 as uuidv4 } from 'uuid';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ScheduleEmailDto } from '../common/dto/email.dto';
import { SERVICES } from '../constants/enums';
import { ClientRMQ } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { NOTIFICATION_PATTERNS } from '../constants/notification-patterns';

dayjs.extend(customParseFormat);

@Injectable()
export class CommonService {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(SERVICES.NOTIFICATION) private notificationClient: ClientRMQ
  ) {}
  private readonly allowedImageTypesForProfilePicture = ['png', 'jpg', 'jpeg'];

  profilePictureMimetype(mimetype: string) {
    const type: any = mimetype.split('/').at(-1);
    return this.allowedImageTypesForProfilePicture.includes(type);
  }

  checkExtension(filename: string) {
    const splitName = filename.split('.');
    if (splitName.length > 1) {
      return {
        status: true,
        extension: splitName.at(-1),
      };
    }
    return {
      status: false,
      extension: 'null',
    };
  }

  checkFileName(filename: string) {
    const splitName = filename.split('.');
    if (splitName.length > 1) {
      splitName.pop();
      return {
        status: true,
        filename: splitName.join(''),
      };
    }
    return {
      status: false,
      filename: 'null',
    };
  }

  parseOnlyDate(date: any) {
    const dateCheck = dayjs(date, 'DD-MM-YYYY');
    return dateCheck.format('YYYY-MM-DD');
  }

  parseOnlyTime(time: any) {
    const timeCheck = dayjs(time, 'HH:mm');
    return timeCheck;
  }

  isBusinessDay(date) {
    const workingWeekdays = [1, 2, 3, 4, 5];

    if (date.day() == 0 || date.day() == 6) return false;
    if (workingWeekdays.includes(date.day())) return true;

    return false;
  }

  workingDays(date, unit): Dayjs[] {
    if (!dayjs(date).isValid()) return [];

    let currentDate = dayjs(date);

    if (currentDate.day() == 0 && unit == 'week') {
      currentDate = currentDate.subtract(1, 'day');
    }
    currentDate = currentDate.startOf(unit);
    const endDate = currentDate.endOf(unit);

    const businessDays: any = [];
    let monthComplete = false;

    while (!monthComplete) {
      if (this.isBusinessDay(currentDate))
        businessDays.push(currentDate.clone());

      currentDate = currentDate.add(1, 'day');

      if (currentDate.isAfter(endDate)) monthComplete = true;
    }

    return businessDays;
  }

  toJSON(response: any) {
    let dateToJSON = JSON.parse(JSON.stringify(response));
    return dateToJSON;
  }

  getPagination(page, size) {
    const limit = size ? +size : 10;
    const offset = page ? +page * limit : 0;
    return { limit, offset };
  }

  getPagingResponse(data, page, limit) {
    if (data) {
      const { count: totalItems } = data;
      const currentPage = page ? +page : 1;
      const totalPages = Math.ceil(totalItems / (limit ? +limit : 10));
      const pageLimit = limit ? +limit : 10;
      return { totalItems, totalPages, currentPage, pageLimit };
    }
    return { totalItems: 0, totalPages: 0, currentPage: 0, pageLimit: 0 };
  }

  getMonthName(month: number): string {
    const months: string[] = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return months[month - 1];
  }

  timeDifference(start: Date | string, end: Date | string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const differenceInMilliseconds = endDate.getTime() - startDate.getTime();
    const differenceInMinutes = differenceInMilliseconds / 1000 / 60;
    const days = Math.floor(differenceInMinutes / 60 / 24);
    const hours = Math.floor(differenceInMinutes / 60) % 24;
    const minutes = Math.round(differenceInMinutes % 60);
    return { days, hours, minutes };
  }

  async checkStartDateAndEndDate(
    startDate: Date | string,
    endDate: Date | string
  ) {
    const startDateObj = dayjs(startDate, 'YYYY-MM-DD');
    const endDateObj = dayjs(endDate, 'YYYY-MM-DD');
    return !startDateObj.isAfter(endDateObj);
  }

  formatDate(date: any) {
    const dateCheck = dayjs(date, 'DD-MM-YYYY');
    return dateCheck.format('YYYY-MM-DD');
  }

  removeNullValues(obj) {
    if (typeof obj !== 'object' || obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(this.removeNullValues).filter(Boolean);
    }

    return Object.fromEntries(
      Object.entries(obj)
        .filter(
          ([key, value]) =>
            value !== null && value !== '' && value !== undefined
        )
        .map(([key, value]) => [key, this.removeNullValues(value)])
    );
  }

  async sendMail(payload: {
    from?: string;
    recipients: string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
    ccRecipients?: string[];
    dbNotification?: {
      userId: string;
      notifiedBy?: string;
      type: string;
      data: any;
      title: string;
      message: string;
    };
  }) {
    const {
      from,
      recipients,
      subject,
      text,
      html,
      attachments,
      ccRecipients,
      dbNotification: notification,
    } = payload;
    const mailOptions: ISendMailOptions = {
      to: recipients,
      subject,
    };

    if (ccRecipients && ccRecipients.length > 0) {
      mailOptions.cc = ccRecipients;
    }

    if (from) {
      mailOptions.from = from;
    }

    if (text) {
      mailOptions.text = text;
    }

    if (html) {
      mailOptions.html = html;
    }

    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map((attachment) => ({
        filename: attachment.originalname,
        content: Buffer.from(attachment.buffer),
        encoding: 'base64',
        mimetype: attachment.mimetype,
      }));
    }

    try {
      return await firstValueFrom(
        this.notificationClient.emit(
          NOTIFICATION_PATTERNS.GENERAL.INITIATE_MAIL,
          { ...mailOptions, ...(notification && { notification }) }
        )
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async scheduleMail(
    now: Date,
    emailSendAt: Date,
    payload: ScheduleEmailDto
  ): Promise<string> {
    try {
      const delay = emailSendAt.getTime() - now.getTime();
      const jobId = uuidv4();

      // Schedule task to send the email in the future
      this.schedulerRegistry.addTimeout(jobId, delay);
      setTimeout(async () => await this.sendMail(payload), delay);

      return 'Email will be sent at the scheduled time';
    } catch (error) {
      Logger.error('Error scheduling or sending email: ', error);
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
