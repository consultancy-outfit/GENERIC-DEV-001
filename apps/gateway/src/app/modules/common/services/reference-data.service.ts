import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { COUNTRIES, STATES } from '@gateway/mocks';
import { ClientRMQ } from '@nestjs/microservices';
import { MESSAGE_PATTERNS, SERVICES } from '@shared/constants';

const { RUN_LOOKUP } = MESSAGE_PATTERNS.LOOKUP;
const { GET_COMPANY_PROFILE } = MESSAGE_PATTERNS.USER_PROFILE.COMPANY;

@Injectable()
export class ReferenceDataService {
  protected readonly logger = new Logger(ReferenceDataService.name);
  private ADDRESS_API: string;
  private PARAMS: { 'api-key': string };
  constructor(
    private http: HttpService,
    private config: ConfigService,
    @Inject(SERVICES.USER_PROFILE) private dbClient: ClientRMQ
  ) {
    this.ADDRESS_API = this.config.get('ADDRESS_API_URL');
    this.PARAMS = {
      'api-key': this.config.get('ADDRESS_API_KEY'),
    };
  }

  async searchAddressLocations(search: string) {
    const { data } = await firstValueFrom(
      this.http
        .post(
          `${this.ADDRESS_API}/autocomplete/${encodeURIComponent(search)}`,
          {
            all: true,
            template: '{formatted_address}{postcode,, }{postcode}',
            fuzzy: true,
          },
          {
            params: this.PARAMS,
            headers: {
              origin: 'https://getaddress.io',
            },
          }
        )
        .pipe(
          catchError(() => {
            throw new Error(
              'Searching server issue: Kindly contact the Admin.'
            );
          })
        )
    );
    const response = data.suggestions?.map((e) => ({
      id: Buffer.from(e.id, 'base64').toString().replace(/ /g, '-'),
      address: e.address.startsWith('Unit ')
        ? e.address.replace('Unit ', '')
        : e.address,
    }));
    return response;
  }

  async fetchAddressDetails(id: string) {
    const addressId = Buffer.from(id.replace(/-/g, ' '), 'utf8').toString(
      'base64'
    );
    const { data } = await firstValueFrom(
      this.http
        .get(`${this.ADDRESS_API}/get/${addressId}`, {
          params: this.PARAMS,
          headers: {
            origin: 'https://getaddress.io',
          },
        })
        .pipe(
          catchError((error: any) => {
            if (error.message.includes('not a valid Id')) {
              throw Error('Not a valid Address ID.');
            }
            throw Error('Searching server issue: Kindly contact the Admin.');
          })
        )
    );
    return {
      addressLine: data?.formatted_address?.slice(0, -2)?.join('\n'),
      country: 'United Kingdom',
      state: data?.county?.replace(/county/i, '')?.trim(),
      city: data?.town_or_city,
      zipCode: data?.postcode,
    };
  }

  public getCountries(): any[] {
    return COUNTRIES;
  }

  public getStates(country: string): any[] {
    if (country === 'United Kingdom') {
      return STATES.map((state: any) => state.state);
    } else {
      return [];
    }
  }

  public getCities(state: string): any[] {
    const stateObj = STATES.find(
      (_: any) => _?.state?.toLowerCase() === state?.toLowerCase()
    );
    if (!stateObj) return [];
    return stateObj.cities;
  }

  public runLookup({ companyId, query }) {
    return this.dbClient.send(RUN_LOOKUP, { companyId, ...query });
  }

  public async getFeedbackVisibilities({ companyId }) {
    try {
      const company = await firstValueFrom(
        this.dbClient.send(GET_COMPANY_PROFILE, {
          companyId,
          projection: { permittedFeedbackTypes: true },
        })
      );

      return Object.entries(company?.permittedFeedbackTypes ?? [])
        .filter(([_, v]) => !!v)
        .map(([k, _]) => k);
    } catch (err) {
      this.logger.warn('Could not retrieve Feedback visibilities.');
      return;
    }
  }

  public async randomPassword() {
    return Math.random().toString(36).slice(-8);
  }
}
