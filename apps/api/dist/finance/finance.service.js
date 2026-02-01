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
var FinanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma = new client_1.PrismaClient();
let FinanceService = FinanceService_1 = class FinanceService {
    constructor() {
        this.logger = new common_1.Logger(FinanceService_1.name);
    }
    async recordEvent(type, referenceId, amount, metadata = {}) {
        return prisma.financialEvent.create({
            data: {
                type,
                referenceId,
                amount,
                metadata,
            }
        });
    }
    async postLedgerEntry(eventId, entries) {
        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            this.logger.error(`Ledger Imbalance! Debit: ${totalDebit}, Credit: ${totalCredit}`);
            throw new Error('Ledger Entry Imbalanced');
        }
        await prisma.ledgerEntry.createMany({
            data: entries.map(e => ({
                eventId,
                account: e.account,
                debit: e.debit,
                credit: e.credit,
                description: e.description
            }))
        });
    }
    async handleBookingConfirmed(payload) {
        const booking = await prisma.booking.findUnique({ where: { id: payload.bookingId } });
        if (!booking)
            return;
        const event = await this.recordEvent('BOOKING_CONFIRMED', booking.id, Number(booking.totalAmount));
        await this.postLedgerEntry(event.id, [
            { account: 'ASSET:CASH', debit: Number(booking.totalAmount), credit: 0, description: 'Booking Payment Received' },
            { account: 'LIABILITY:UNEARNED_REVENUE', debit: 0, credit: Number(booking.totalAmount), description: 'Service Obligation' }
        ]);
        this.logger.log(`Financial Ledger updated for Booking ${booking.id}`);
    }
    async getFinancialHealth() {
        const result = await prisma.ledgerEntry.groupBy({
            by: ['account'],
            _sum: { debit: true, credit: true }
        });
        return result.map(r => ({
            account: r.account,
            balance: (Number(r._sum.debit) || 0) - (Number(r._sum.credit) || 0)
        }));
    }
};
exports.FinanceService = FinanceService;
__decorate([
    (0, event_emitter_1.OnEvent)('booking.confirmed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinanceService.prototype, "handleBookingConfirmed", null);
exports.FinanceService = FinanceService = FinanceService_1 = __decorate([
    (0, common_1.Injectable)()
], FinanceService);
//# sourceMappingURL=finance.service.js.map