import { Module } from '@nestjs/common';
import { MockGeocodingService } from './mock-geocoding.service';

@Module({
  providers: [MockGeocodingService],
  exports: [MockGeocodingService],
})
export class GeocodingModule {}
