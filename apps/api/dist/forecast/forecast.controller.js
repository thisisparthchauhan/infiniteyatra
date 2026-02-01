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
exports.ForecastController = void 0;
const common_1 = require("@nestjs/common");
const forecast_service_1 = require("./forecast.service");
const passport_1 = require("@nestjs/passport");
let ForecastController = class ForecastController {
    constructor(forecastService) {
        this.forecastService = forecastService;
    }
    async predict(id) {
        return this.forecastService.generateForecast(id);
    }
    async capture() {
        return this.forecastService.captureDailySignals();
    }
};
exports.ForecastController = ForecastController;
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('predict/:departureId'),
    __param(0, (0, common_1.Param)('departureId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ForecastController.prototype, "predict", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('capture-signals'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ForecastController.prototype, "capture", null);
exports.ForecastController = ForecastController = __decorate([
    (0, common_1.Controller)('forecast'),
    __metadata("design:paramtypes", [forecast_service_1.ForecastService])
], ForecastController);
//# sourceMappingURL=forecast.controller.js.map