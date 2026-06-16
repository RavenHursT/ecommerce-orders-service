import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Client, Status } from '@googlemaps/google-maps-services-js';
import type { ShippingAddress } from '@repo/schemas';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

@Injectable()
export class GoogleGeocodingService {
  private readonly client = new Client({});

  async geocode(address: ShippingAddress): Promise<Coordinates> {
    const { GOOGLE_MAPS_API_KEY } = process.env;

    if (!GOOGLE_MAPS_API_KEY) {
      throw new InternalServerErrorException('GOOGLE_MAPS_API_KEY is not configured');
    }

    const { country } = address;
    const formattedAddress = this.formatAddress(address);

    let response;

    try {
      response = await this.client.geocode({
        params: {
          address: formattedAddress,
          key: GOOGLE_MAPS_API_KEY,
          components: `country:${country}`,
        },
      });
    } catch {
      throw new ServiceUnavailableException('Geocoding service is unavailable');
    }

    const { results, status, error_message: errorMessage } = response.data;

    if (status === Status.ZERO_RESULTS) {
      throw new BadRequestException('Shipping address could not be geocoded');
    }

    if (status === Status.OVER_QUERY_LIMIT) {
      throw new ServiceUnavailableException('Geocoding quota exceeded');
    }

    if (status !== Status.OK || results.length === 0) {
      throw new ServiceUnavailableException(
        errorMessage ?? `Geocoding failed with status ${status}`,
      );
    }

    const { lat, lng } = results[0].geometry.location;

    return {
      latitude: lat,
      longitude: lng,
    };
  }

  private formatAddress({
    line1,
    line2,
    city,
    state,
    postalCode,
    country,
  }: ShippingAddress) {
    return [line1, line2, city, state, postalCode, country]
      .filter(Boolean)
      .join(', ');
  }
}
