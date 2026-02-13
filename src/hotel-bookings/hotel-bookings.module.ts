import { Module } from '@nestjs/common';
import { HotelBookingsController } from './hotel-bookings.controller';
import { HotelBookingsService } from './hotel-bookings.service';

@Module({
  controllers: [HotelBookingsController],
  providers: [HotelBookingsService]
})
export class HotelBookingsModule {}
