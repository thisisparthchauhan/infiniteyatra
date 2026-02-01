export declare class FinanceService {
    private readonly logger;
    recordEvent(type: string, referenceId: string, amount: number, metadata?: any): Promise<{
        id: string;
        type: string;
        referenceId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        metadata: import(".prisma/client").Prisma.JsonValue | null;
        createdAt: Date;
    }>;
    postLedgerEntry(eventId: string, entries: {
        account: string;
        debit: number;
        credit: number;
        description?: string;
    }[]): Promise<void>;
    handleBookingConfirmed(payload: {
        bookingId: string;
    }): Promise<void>;
    getFinancialHealth(): Promise<{
        account: string;
        balance: number;
    }[]>;
}
