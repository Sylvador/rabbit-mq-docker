import { NestFactory } from '@nestjs/core';
import { ProfileModule } from './profile.module';
import { ValidationPipe } from '@nestjs/common';
import { SharedService } from '@app/common/rmq/shared.services';

async function bootstrap() {
  const app = await NestFactory.create(ProfileModule);
  app.enableCors();

  const sharedService = app.get(SharedService);
  app.connectMicroservice(sharedService.getRmqOptions('profile_queue'));

  app.useGlobalPipes(new ValidationPipe());

  app.startAllMicroservices();
  app.listen(6000).then(() => console.log(`Microservice PROFILE is listening`));
}
bootstrap();
