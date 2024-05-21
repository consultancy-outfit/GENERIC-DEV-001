export class AddReminderDto {
  label: string;
  dateAndTime: Date;
  createdBy?: string;
}

export class ListReminderDto {
  month: number;
  year: number;
}

export class GetReminderDto {
  date: string;
  time?: string;
}
