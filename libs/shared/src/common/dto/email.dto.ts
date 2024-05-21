export class ScheduleEmailDto {
  recipients: string[];
  ccRecipients?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<IAttachment>;
}
interface IAttachment {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: string;
}
