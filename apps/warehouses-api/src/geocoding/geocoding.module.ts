import { Module } from '@nestjs/common';
import { GoogleGeocodingService } from './google-geocoding.service';

@Module({
  providers: [GoogleGeocodingService],
  exports: [GoogleGeocodingService],
})
export class GeocodingModule {}
