"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const hotel_bookings_service_1 = require("./hotel-bookings.service");
describe('HotelBookingsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [hotel_bookings_service_1.HotelBookingsService],
        }).compile();
        service = module.get(hotel_bookings_service_1.HotelBookingsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=hotel-bookings.service.spec.js.map