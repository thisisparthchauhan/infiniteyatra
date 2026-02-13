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
var PermissionsGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permissions_decorator_1 = require("./permissions.decorator");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let PermissionsGuard = PermissionsGuard_1 = class PermissionsGuard {
    constructor(reflector) {
        this.reflector = reflector;
        this.logger = new common_1.Logger(PermissionsGuard_1.name);
    }
    async canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredPermissions) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        if (!user || !user.id) {
            this.logger.warn('User not found in request context');
            return false;
        }
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
        if (!userWithRoles)
            return false;
        const userPermissions = new Set();
        if (userWithRoles.userRoles.some(ur => ur.role.name === 'SUPER_ADMIN')) {
            return true;
        }
        userWithRoles.userRoles.forEach(ur => {
            ur.role.permissions.forEach(p => userPermissions.add(p.action));
        });
        const hasPermission = requiredPermissions.every((permission) => userPermissions.has(permission));
        if (!hasPermission) {
            this.logger.warn(`User ${user.id} denied access to ${requiredPermissions.join(', ')}`);
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
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = PermissionsGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map