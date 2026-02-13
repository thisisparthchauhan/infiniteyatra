import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { HotelsService } from './hotels.service';

@Controller('hotels')
export class HotelsController {
    constructor(private readonly hotelsService: HotelsService) { }

    @Post()
    create(@Body() createHotelDto: any) {
        return this.hotelsService.createHotel(createHotelDto);
    }

    @Get()
    findAll(@Query() query: any) {
        return this.hotelsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.hotelsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateHotelDto: any) {
        return this.hotelsService.update(id, updateHotelDto);
    }

    @Post(':id/rooms')
    addRoom(@Param('id') id: string, @Body() createRoomDto: any) {
        return this.hotelsService.addRoomType(id, createRoomDto);
    }
}
