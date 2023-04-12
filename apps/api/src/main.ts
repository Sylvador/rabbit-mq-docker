import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  
  const configService = new ConfigService();
  const PORT = configService.get<string>('PORT');
  const config = new DocumentBuilder()
    .setTitle('Homework MicroServices')
    .setDescription('Homework API description')
    .setVersion('2.0')
    .addTag('RabbitMQ')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.startAllMicroservices();
  await app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));
}
bootstrap();
