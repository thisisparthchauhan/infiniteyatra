import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';

import { InventoryModule } from '../inventory/inventory.module';

@Module({
    imports: [InventoryModule],
    controllers: [BookingController],
    providers: [BookingService],
    exports: [BookingService],
})
export class BookingModule { }
