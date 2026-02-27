import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('catalog')
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    @Get('packages')
    async getPackages() {
        return this.catalogService.getPackages();
    }

    @Get('package/:slug')
    async getPackage(@Param('slug') slug: string) {
        return this.catalogService.getPackage(slug);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('package')
    async createPackage(@Body() body) {
        return this.catalogService.createPackage(body);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('departure')
    async addDeparture(@Body() body) {
        return this.catalogService.addDeparture(body);
    }
}
