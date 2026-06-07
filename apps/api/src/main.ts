import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
// Kök .env dosyasını uygulama başlamadan yükle (DATABASE_URL, JWT vb.)
loadEnv({ path: resolve(process.cwd(), "../../.env") });

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });
  // Doğrulama, paylaşılan zod şemaları ile route bazında yapılır (ZodValidationPipe).

  const swaggerConfig = new DocumentBuilder()
    .setTitle("TİGNAL API")
    .setDescription("Cep telefonu aksesuarları yönetim sistemi API'si")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  // Bulut sağlayıcıları (Render vb.) portu PORT ile verir; yerelde API_PORT.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  await app.listen(port);
  console.log(`🚀 TİGNAL API çalışıyor: http://localhost:${port}/api`);
  console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
