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
exports.CostController = void 0;
const common_1 = require("@nestjs/common");
const cost_service_1 = require("./cost.service");
const passport_1 = require("@nestjs/passport");
let CostController = class CostController {
    constructor(costService) {
        this.costService = costService;
    }
    async addCost(body) {
        return this.costService.addCost(body.departureId, body);
    }
    async analyze(id) {
        return this.costService.calculateTripFinancials(id);
    }
    async snapshot(id) {
        return this.costService.captureSnapshot(id);
    }
};
exports.CostController = CostController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('entry'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CostController.prototype, "addCost", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('analysis/:departureId'),
    __param(0, (0, common_1.Param)('departureId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CostController.prototype, "analyze", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('snapshot/:departureId'),
    __param(0, (0, common_1.Param)('departureId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CostController.prototype, "snapshot", null);
exports.CostController = CostController = __decorate([
    (0, common_1.Controller)('cost'),
    __metadata("design:paramtypes", [cost_service_1.CostService])
], CostController);
//# sourceMappingURL=cost.controller.js.map