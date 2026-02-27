import { Controller, Get, Post, Body, Param, Patch, Query } from '@nestjs/common';
import { HotelBookingsService } from './hotel-bookings.service';

@Controller('hotel-bookings')
export class HotelBookingsController {
    constructor(private readonly hotelBookingsService: HotelBookingsService) { }

    @Post()
    create(@Body() createBookingDto: any) {
        // Ideally get userId from request (Auth Guard), for now taking it from body or hardcoding for testing
        const userId = createBookingDto.userId;
        return this.hotelBookingsService.createBooking(userId, createBookingDto);
    }

    @Get()
    findAll(@Query('userId') userId: string) {
        return this.hotelBookingsService.findAll(userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.hotelBookingsService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.hotelBookingsService.updateStatus(id, status);
    }
}
