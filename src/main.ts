import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- THÊM DÒNG NÀY ĐỂ MỞ KHÓA CORS ---
  app.enableCors(); 
  // -------------------------------------

  await app.listen(3000);
}
bootstrap();