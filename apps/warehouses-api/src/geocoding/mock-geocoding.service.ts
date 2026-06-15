import { Injectable } from '@nestjs/common';
import type { ShippingAddress } from '@repo/schemas';

type Coordinates = {
  latitude: number;
  longitude: number;
};

const KNOWN_POSTAL_COORDINATES: Record<string, Coordinates> = {
  '10118': { latitude: 40.7484, longitude: -73.9857 },
  '60606': { latitude: 41.8781, longitude: -87.6298 },
  '75201': { latitude: 32.7767, longitude: -96.797 },
  '90021': { latitude: 34.0522, longitude: -118.2437 },
  '07114': { latitude: 40.7357, longitude: -74.1724 },
};

@Injectable()
export class MockGeocodingService {
  geocode({ postalCode, country }: ShippingAddress): Coordinates {
    const knownCoordinates = KNOWN_POSTAL_COORDINATES[postalCode];

    if (knownCoordinates) {
      return knownCoordinates;
    }

    const input = `${country}:${postalCode}`;
    let hash = 0;

    for (let index = 0; index < input.length; index += 1) {
      hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
    }

    return {
      latitude: 25 + (hash % 2400) / 100,
      longitude: -125 + ((hash >> 12) % 5500) / 100,
    };
  }
}
