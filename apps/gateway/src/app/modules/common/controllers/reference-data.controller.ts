import {
  Controller,
  Get,
  Query,
  Logger,
  Param,
  Inject,
  Req,
} from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ClientRMQ } from '@nestjs/microservices';
import {
  GetAddressLocationResponse,
  SearchAddressLocationsResponse,
  CitiesResponseDto,
  StatesResponseDto,
  ListReferenceDataResponseDto,
  LookupRequestDto,
  LookupResponseDto,
  CountriesResponseDto,
} from '../dto/reference-data';
import { ReferenceDataService } from '../services';
import { SERVICES } from '@shared/constants';
import { ApiRoute } from '@gateway/decorators';

@ApiTags('Reference Data')
@Controller('reference-data')
export class ReferenceDataController {
  protected readonly logger = new Logger(ReferenceDataController.name);
  constructor(
    @Inject(SERVICES.USER_PROFILE) private dbClient: ClientRMQ,
    private refSvc: ReferenceDataService
  ) {}

  @Get()
  @ApiRoute({
    name: 'Retrieve Reference Data',
    description: 'Retrieve Reference Data',
    permission: '*',
  })
  @ApiOkResponse({ type: ListReferenceDataResponseDto })
  async list(@Req() { user: { companyId } }) {
    return {
      ...(companyId && {
        feedbackVisibilities:
          (await this.refSvc.getFeedbackVisibilities({ companyId })) ?? [],
      }),
    };
  }

  @Get('lookup')
  @ApiRoute({
    name: 'Run Lookup',
    description: 'Run lookup for various',
    permission: '*',
  })
  @ApiOkResponse({ type: LookupResponseDto })
  async lookup(
    @Req() { user: { companyId } },
    @Query() query: LookupRequestDto
  ) {
    return this.refSvc.runLookup({ companyId, query });
  }

  @Get('address-locations')
  @ApiQuery({
    name: 'search',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: SearchAddressLocationsResponse,
  })
  async listAddressLocations(@Query('search') search: string) {
    return this.refSvc.searchAddressLocations(search);
  }

  @Get('address-locations/:id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: GetAddressLocationResponse,
  })
  async getAddressLocation(@Param('id') id: string) {
    return this.refSvc.fetchAddressDetails(id);
  }

  @Get('countries')
  @ApiOkResponse({ type: CountriesResponseDto })
  async countries() {
    return this.refSvc.getCountries();
  }

  @Get('states')
  @ApiQuery({
    name: 'country',
    schema: {
      type: 'string',
      default: 'United Kingdom',
    },
    required: true,
  })
  @ApiOkResponse({ type: StatesResponseDto })
  async states(@Query('country') country: string) {
    return this.refSvc.getStates(country);
  }

  @Get('cities')
  @ApiOkResponse({ type: CitiesResponseDto })
  async cities(@Query('state') state: string) {
    return this.refSvc.getCities(state);
  }
}
