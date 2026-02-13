"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const helmet_1 = require("helmet");
async function bootstrap() {
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        app.use((0, helmet_1.default)());
        app.enableCors({
            origin: ['https://infiniteyatra-iy.web.app', 'https://infiniteyatra.com', 'http://localhost:5173', 'http://localhost:3000'],
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            credentials: true,
        });
        const port = process.env.PORT || 3000;
        await app.listen(port, '0.0.0.0');
        console.log(`Application is running on: ${await app.getUrl()}`);
        console.log(`Listening on port: ${port}`);
    }
    catch (error) {
        console.error('Error starting application:', error);
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
//# sourceMappingURL=main.js.map