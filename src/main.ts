import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(helmet());
    app.enableCors({
        origin: ['https://infiniteyatra-iy.web.app', 'https://infiniteyatra.com', 'http://localhost:5173'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    const port = process.env.PORT || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: ${await app.getUrl()}`);
    console.log(`Listening on port: ${port}`);
}
bootstrap();
