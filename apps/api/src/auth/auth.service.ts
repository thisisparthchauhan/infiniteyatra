import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            }
        };
    }

    async register(data: any) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                role: data.role || 'CUSTOMER',
                profile: {
                    create: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                    }
                }
            },
        });
        const { password, ...result } = user;
        return result;
    }
}
