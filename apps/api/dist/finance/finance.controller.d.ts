import { FinanceService } from './finance.service';
export declare class FinanceController {
    private readonly financeService;
    constructor(financeService: FinanceService);
    getHealth(): Promise<{
        account: string;
        balance: number;
    }[]>;
}
