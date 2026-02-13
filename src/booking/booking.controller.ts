import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { BookingService } from './booking.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('booking')
export class BookingController {
    constructor(private readonly bookingService: BookingService) { }

    @UseGuards(AuthGuard('jwt'))
    @Post('create')
    async createBooking(@Request() req, @Body() body) {
        return this.bookingService.createBooking(req.user.userId, body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('confirm')
    async confirmBooking(@Body() body) {
        return this.bookingService.confirmBooking(body.bookingId, body.paymentReference, body.lockId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('my-bookings')
    async getMyBookings(@Request() req) {
        return this.bookingService.getUserBookings(req.user.userId);
    }
}
