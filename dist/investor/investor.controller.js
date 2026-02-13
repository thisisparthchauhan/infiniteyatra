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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestorController = void 0;
const common_1 = require("@nestjs/common");
const investor_service_1 = require("./investor.service");
const passport_1 = require("@nestjs/passport");
let InvestorController = class InvestorController {
    constructor(investorService) {
        this.investorService = investorService;
    }
    async getDashboard() {
        return this.investorService.getDashboardData();
    }
    async refresh() {
        return this.investorService.captureGrowthSnapshot();
    }
};
exports.InvestorController = InvestorController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvestorController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('refresh-snapshot'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvestorController.prototype, "refresh", null);
exports.InvestorController = InvestorController = __decorate([
    (0, common_1.Controller)('investor'),
    __metadata("design:paramtypes", [investor_service_1.InvestorService])
], InvestorController);
//# sourceMappingURL=investor.controller.js.map