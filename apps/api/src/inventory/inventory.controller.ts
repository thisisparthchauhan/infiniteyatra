import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get('status/:departureId')
    async getStatus(@Param('departureId') id: string) {
        return this.inventoryService.getInventoryStatus(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('reserve')
    async reserve(@Body() body) {
        return this.inventoryService.reserveSeats(body.departureId, body.seats, body.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('release')
    async release(@Body() body) {
        return this.inventoryService.releaseSeats(body.departureId, body.lockId);
    }
}
