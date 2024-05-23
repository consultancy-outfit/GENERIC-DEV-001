import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AACApiDto } from '@shared/dto';

@Injectable()
export class AACLeadGenerationService {
  protected readonly logger = new Logger(AACLeadGenerationService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async createLead(payload: AACApiDto) {
    const url = this.configService.get('AAC_API_URL');
    const apiKey = this.configService.get('AAC_API_KEY');
    const headers = {
      accept: 'application/json',
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    };
    const data: AACApiDto = {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      dateOfJoining: new Date().toISOString(),
    };

    if (payload.dateOfBirth) {
      data.dateOfBirth = payload.dateOfBirth;
    }
    if (payload.address) {
      data.address = payload.address;
    }
    if (payload.phoneNumber) {
      data.phoneNumber = payload.phoneNumber;
    }

    if (payload.companyName) {
      data.companyName = payload.companyName;
    }

    try {
      const response = await this.httpService
        .post(url, data, { headers })
        .toPromise();
      return response.data;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
