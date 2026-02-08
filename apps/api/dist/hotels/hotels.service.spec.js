"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const hotels_service_1 = require("./hotels.service");
describe('HotelsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [hotels_service_1.HotelsService],
        }).compile();
        service = module.get(hotels_service_1.HotelsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=hotels.service.spec.js.map