"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const hotel_bookings_controller_1 = require("./hotel-bookings.controller");
describe('HotelBookingsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [hotel_bookings_controller_1.HotelBookingsController],
        }).compile();
        controller = module.get(hotel_bookings_controller_1.HotelBookingsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=hotel-bookings.controller.spec.js.map