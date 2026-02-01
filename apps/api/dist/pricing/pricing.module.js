"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingModule = void 0;
const common_1 = require("@nestjs/common");
const pricing_service_1 = require("./pricing.service");
const pricing_controller_1 = require("./pricing.controller");
const pricing_engine_1 = require("./pricing.engine");
let PricingModule = class PricingModule {
};
exports.PricingModule = PricingModule;
exports.PricingModule = PricingModule = __decorate([
    (0, common_1.Module)({
        controllers: [pricing_controller_1.PricingController],
        providers: [pricing_service_1.PricingService, pricing_engine_1.PricingEngine],
        exports: [pricing_service_1.PricingService],
    })
], PricingModule);
//# sourceMappingURL=pricing.module.js.map