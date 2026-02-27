import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient(); // Ideally inject via generic service/module

@Injectable()
export class PermissionsGuard implements CanActivate {
    private readonly logger = new Logger(PermissionsGuard.name);

    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions) {
            return true; // No permissions required
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.id) {
            this.logger.warn('User not found in request context');
            return false;
        }

        // Custom Logic: Fetch User Roles & Permissions
        // In production, cache this!
        const userWithRoles = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: { permissions: true }
                        }
                    }
                }
            }
        });

        if (!userWithRoles) return false;

        // Flatten permissions
        const userPermissions = new Set<string>();

        // Super Admin Bypass
        if (userWithRoles.userRoles.some(ur => ur.role.name === 'SUPER_ADMIN')) {
            return true;
        }

        userWithRoles.userRoles.forEach(ur => {
            ur.role.permissions.forEach(p => userPermissions.add(p.action));
        });

        // Check if user has ALL required permissions (or ANY, depending on policy. Let's do ALL)
        const hasPermission = requiredPermissions.every((permission) => userPermissions.has(permission));

        // Audit Log (Optimistic - log success/fail)
        // We log here or via interceptor. For Guard, we usually just return bool.
        // Let's log failure.
        if (!hasPermission) {
            this.logger.warn(`User ${user.id} denied access to ${requiredPermissions.join(', ')}`);

            // Async log to DB
            prisma.accessLog.create({
                data: {
                    userId: user.id,
                    action: 'ACCESS_DENIED',
                    resource: requiredPermissions.join(','),
                    granted: false
                }
            }).catch(err => console.error('Audit Log Error', err));
        }

        return hasPermission;
    }
}
