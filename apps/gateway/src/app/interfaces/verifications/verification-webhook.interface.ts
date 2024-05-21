import {
  VerificationDocumentEnum,
  VerificationStatusEnum,
} from '@shared/constants';

export interface IVerificationWebhookResponse {
  id: string;
  integrationId: string;
  status: VerificationStatusEnum;
  uniqueIdentifier: string;
  documentType?: VerificationDocumentEnum | null;
  requestUrl: string;
  verificationDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    gender: string | null;
    idNumber: string | null;
    nationality: string | null;
    placeOfBirth: string | null;
    name: string | null;
    surname: string | null;
    expiration_date: string | null;
    address: string | null;
    country: string | null;
  };
  reason: string | null;
}
