import { Test, TestingModule } from '@nestjs/testing';
import { HotelBookingsController } from './hotel-bookings.controller';

describe('HotelBookingsController', () => {
  let controller: HotelBookingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelBookingsController],
    }).compile();

    controller = module.get<HotelBookingsController>(HotelBookingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
