"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationsModule = void 0;
const common_1 = require("@nestjs/common");
const operations_service_1 = require("./operations.service");
const operations_controller_1 = require("./operations.controller");
let OperationsModule = class OperationsModule {
};
exports.OperationsModule = OperationsModule;
exports.OperationsModule = OperationsModule = __decorate([
    (0, common_1.Module)({
        controllers: [operations_controller_1.OperationsController],
        providers: [operations_service_1.OperationsService],
        exports: [operations_service_1.OperationsService],
    })
], OperationsModule);
//# sourceMappingURL=operations.module.js.map