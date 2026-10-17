import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    bodyParser: false, // Required for Better Auth
  });

    app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });


  // project description
  // app.setGlobalPrefix('api'); // sets a global prefix for all routes, e.g., /api/users
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // strips unknown fields
    forbidNonWhitelisted: true, // throws error on unknown fields
    transform: true,       // auto-transforms types
  }));

  await app.listen(process.env.PORT ?? 3001);
  
}
bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});
