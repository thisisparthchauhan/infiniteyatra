import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('operations')
export class OperationsController {
    constructor(private readonly opsService: OperationsService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('assign')
    async assignResource(@Body() body) {
        return this.opsService.assignResource(body.departureId, body.type, body.resourceId, body.role);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('incident')
    async logIncident(@Body() body, @Param('userId') userId: string) { // In real app, get user from Req
        // Mocking user ID for simplicity if not in request
        return this.opsService.logIncident(body.userId, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('refresh-readiness')
    async refresh() {
        return this.opsService.updateReadiness();
    }
}
