import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            role: any;
        };
    }>;
    register(data: any): Promise<{
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.LegacyRole;
        ltv: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
