"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingEngine = void 0;
const common_1 = require("@nestjs/common");
let PricingEngine = class PricingEngine {
    evaluate(signals, rules, basePrice) {
        let price = basePrice;
        let appliedRule = null;
        const sortedRules = rules.sort((a, b) => b.priority - a.priority);
        for (const rule of sortedRules) {
            if (this.checkCondition(signals, rule.condition)) {
                const action = rule.action;
                if (action.type === 'MULTIPLY') {
                    price = price * action.value;
                }
                else if (action.type === 'ADD') {
                    price = price + action.value;
                }
                appliedRule = rule;
                break;
            }
        }
        if (!appliedRule) {
            return { suggestedPrice: basePrice, ruleId: null, reason: 'No pricing rules matched. Base price maintained.' };
        }
        return {
            suggestedPrice: price,
            ruleId: appliedRule.id,
            reason: appliedRule.name + ` (${appliedRule.description})`
        };
    }
    checkCondition(signals, condition) {
        for (const [key, criteria] of Object.entries(condition)) {
            const signalValue = signals[key];
            const crit = criteria;
            if (crit.gt !== undefined && signalValue <= crit.gt)
                return false;
            if (crit.lt !== undefined && signalValue >= crit.lt)
                return false;
            if (crit.gte !== undefined && signalValue < crit.gte)
                return false;
            if (crit.lte !== undefined && signalValue > crit.lte)
                return false;
        }
        return true;
    }
};
exports.PricingEngine = PricingEngine;
exports.PricingEngine = PricingEngine = __decorate([
    (0, common_1.Injectable)()
], PricingEngine);
//# sourceMappingURL=pricing.engine.js.map