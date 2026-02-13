import { Test, TestingModule } from '@nestjs/testing';
import { HotelBookingsService } from './hotel-bookings.service';

describe('HotelBookingsService', () => {
  let service: HotelBookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HotelBookingsService],
    }).compile();

    service = module.get<HotelBookingsService>(HotelBookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
