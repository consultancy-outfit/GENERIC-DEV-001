import { BadRequestException } from '@nestjs/common';

export class InvalidFileFormatException extends BadRequestException {}
