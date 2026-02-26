import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule);
        app.use(helmet());
        app.enableCors({
            origin: ['https://infiniteyatra-iy.web.app', 'https://infiniteyatra.com', 'http://localhost:5173', 'http://localhost:3000'],
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            credentials: true,
        });

        // Proxy all non-API requests to the PM2 Next.js server running on port 3000
        // This allows Hostinger's Passenger to serve both NestJS and Next.js via proxy
        const { createProxyMiddleware } = require('http-proxy-middleware');
        app.use(
            /^(?!\/(auth|catalog|booking|inventory|cost|finance|forecast|dashboard|pricing|auto-pricing|operations|investor|redis|hotels|hotel-bookings|health)(?:\/|$)).*/,
            createProxyMiddleware({
                target: 'http://127.0.0.1:3000',
                changeOrigin: true,
            }),
        );

        const port = process.env.PORT || 3000;
        await app.listen(port, '0.0.0.0');
        console.log(`Application is running on: ${await app.getUrl()}`);
        console.log(`Listening on port: ${port}`);
    } catch (error) {
        console.error('Error starting application:', error);

        // Write error to a file for debugging on server
        const fs = require('fs');
        const errorLog = `
Timestamp: ${new Date().toISOString()}
Error: ${error.message}
Stack: ${error.stack}
----------------------------------------
`;
        fs.appendFileSync('server-startup-error.log', errorLog);

        process.exit(1);
    }
}
bootstrap();
