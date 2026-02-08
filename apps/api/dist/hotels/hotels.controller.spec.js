"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const hotels_controller_1 = require("./hotels.controller");
describe('HotelsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [hotels_controller_1.HotelsController],
        }).compile();
        controller = module.get(hotels_controller_1.HotelsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=hotels.controller.spec.js.map