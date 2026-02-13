import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';

const prisma = new PrismaClient();

@Injectable()
export class FinanceService {
    private readonly logger = new Logger(FinanceService.name);

    // 1. RECORD FINANCIAL EVENT (The Entry Point)
    async recordEvent(type: string, referenceId: string, amount: number, metadata: any = {}) {
        return prisma.financialEvent.create({
            data: {
                type,
                referenceId,
                amount,
                metadata,
            }
        });
    }

    // 2. DOUBLE-ENTRY LEDGER LOGIC
    async postLedgerEntry(eventId: string, entries: { account: string; debit: number; credit: number; description?: string }[]) {
        // Validation: Debits must equal Credits
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

    // 3. EVENT LISTENERS

    @OnEvent('booking.confirmed')
    async handleBookingConfirmed(payload: { bookingId: string }) {
        const booking = await prisma.booking.findUnique({ where: { id: payload.bookingId } });
        if (!booking) return;

        // A. Record Event
        const event = await this.recordEvent('BOOKING_CONFIRMED', booking.id, Number(booking.totalAmount));

        // B. Post to Ledger
        // Debit: Cash (Asset) | Credit: Unearned Revenue (Liability)
        // Note: Real "Cash" happens on payment success, but for now we treat confirmed booking as money in.
        // Better: Debit "Accounts Receivable", Credit "Unearned Revenue"
        // Then on Payment: Debit "Cash", Credit "Accounts Receivable"
        // Let's assume Confirmed = Paid for simplicity in v1, or handle correctly if we differentiate.

        await this.postLedgerEntry(event.id, [
            { account: 'ASSET:CASH', debit: Number(booking.totalAmount), credit: 0, description: 'Booking Payment Received' },
            { account: 'LIABILITY:UNEARNED_REVENUE', debit: 0, credit: Number(booking.totalAmount), description: 'Service Obligation' }
        ]);

        this.logger.log(`Financial Ledger updated for Booking ${booking.id}`);
    }

    // TODO: Handle Cost Entry, Refunds, etc.

    // 4. HEALTH CHECK / RECONCILIATION
    async getFinancialHealth() {
        const result = await prisma.ledgerEntry.groupBy({
            by: ['account'],
            _sum: { debit: true, credit: true }
        });

        // Basic P&L
        // Revenue = LIABILITY:UNEARNED_REVENUE moved to REVENUE:SALES (upon trip completion)
        // For now, we just show balances.
        return result.map(r => ({
            account: r.account,
            balance: (Number(r._sum.debit) || 0) - (Number(r._sum.credit) || 0) // Asset/Expense logic
        }));
    }
}
