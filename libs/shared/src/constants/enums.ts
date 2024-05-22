export enum SERVICES {
  USER_ACCOUNT_PROFILE = 'USER_ACCOUNT_PROFILE',
  NOTIFICATION = 'NOTIFICATION',
}

export enum Role {
  USER = 'USER',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum WebhooksTypeEnum {
  EVENT = 'Event',
  DECISION = 'Decision',
  PROOF_ADDRESS = 'Proof Address',
}

export enum VerificationLinkTypeEnum {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  QRCODE = 'QRCODE',
}

export enum VerificationStatusEnum {
  NOT_STARTED = 'Not Started',
  STARTED = 'Started',
  SUBMITTED = 'Submitted',
  EXPIRED = 'Expired',
  ABANDONED = 'Abandoned',
  DECLINED = 'Declined',
  APPROVED = 'Approved',
  UNDER_REVIEW = 'Under Review',
}

export enum VerificationDocumentEnum {
  PASSPORT = 'Passport',
  LICENSE = 'License',
  ADDRESS_PERMIT = 'Address Permit',
  PROOF_ADDRESS = 'Proof Address',
}

export enum VerificationPlatformEnum {
  WEB_REACT_JS = 'Web-React-JS',
  IOS = 'IOS',
  ANDROID = 'Android',
}

export enum SwaggerQueryParamStyle {
  CSV = 'form',
  SPACE = 'spaceDelimited',
  PIPE = 'pipeDelimited',
}

export const SwaggerStyleSeparators: Record<SwaggerQueryParamStyle, string> = {
  [SwaggerQueryParamStyle.CSV]: ',',
  [SwaggerQueryParamStyle.SPACE]: ' ',
  [SwaggerQueryParamStyle.PIPE]: '|',
};

export enum FileContentTypes {
  CSV = 'application/vnd.openxmlformats',
  PDF = 'application/pdf',
  JSON = 'application/json',
  XLS = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

export const SOCKET_ROOM = 'Logger';
