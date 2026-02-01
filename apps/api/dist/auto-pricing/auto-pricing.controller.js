"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoPricingController = void 0;
const common_1 = require("@nestjs/common");
const auto_pricing_service_1 = require("./auto-pricing.service");
const passport_1 = require("@nestjs/passport");
let AutoPricingController = class AutoPricingController {
    constructor(autoPricingService) {
        this.autoPricingService = autoPricingService;
    }
    async setMode(body) {
        return this.autoPricingService.setAutomationMode(body.departureId, body.mode);
    }
    async setGuardrails(body) {
        return this.autoPricingService.setGuardrails(body.departureId, body);
    }
    async evaluate(id) {
        const state = await this.autoPricingService.setAutomationMode(id, 'ADVISORY');
        return this.autoPricingService.calculatePriceAdjustment(id, 'ADVISORY');
    }
};
exports.AutoPricingController = AutoPricingController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('mode'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AutoPricingController.prototype, "setMode", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('guardrails'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AutoPricingController.prototype, "setGuardrails", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('evaluate/:departureId'),
    __param(0, (0, common_1.Param)('departureId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AutoPricingController.prototype, "evaluate", null);
exports.AutoPricingController = AutoPricingController = __decorate([
    (0, common_1.Controller)('auto-pricing'),
    __metadata("design:paramtypes", [auto_pricing_service_1.AutoPricingService])
], AutoPricingController);
//# sourceMappingURL=auto-pricing.controller.js.map