import { ForbiddenException } from '@nestjs/common';

export class UserDisabledException extends ForbiddenException {}
