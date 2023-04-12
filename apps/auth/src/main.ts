import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { ValidationPipe } from '@nestjs/common';
import { SharedService } from '@app/common/rmq/shared.services';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  app.enableCors();

  const sharedService = app.get(SharedService);
  
  app.useGlobalPipes(new ValidationPipe());
  
  app.connectMicroservice(sharedService.getRmqOptions('auth_queue'));
  app.startAllMicroservices();
  app.listen(3000).then(() => console.log(`Microservice AUTH is listening`));
}
bootstrap();
