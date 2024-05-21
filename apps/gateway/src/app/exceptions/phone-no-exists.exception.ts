import { ConflictException } from '@nestjs/common';

export class PhoneNumberAlreadyExists extends ConflictException {}
