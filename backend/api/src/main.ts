import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Import ValidationPipe
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Setup uploads directory
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    // Clean it on startup
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      fs.unlinkSync(path.join(uploadsDir, file));
    }
    console.log('Cleaned uploads directory');
  } else {
    // Create it if it doesn't exist
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
  }

  const app = await NestFactory.create(AppModule);

  // Enable CORS (Cross-Origin Resource Sharing) - IMPORTANT for frontend communication
  app.enableCors({
    origin: 'http://localhost:3001', // Allow requests from your frontend's origin (adjust port if different)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Setup validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Automatically remove properties that are not in the DTO
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
    transform: true, // Automatically transform payloads to DTO instances
    transformOptions: {
        enableImplicitConversion: true, // Allow basic type conversions based on TS type metadata
      },
  }));

  // Setup Swagger docs
  const config = new DocumentBuilder()
    .setTitle('Calendrix API')
    .setDescription('API for Calendrix calendar application')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start server
  await app.listen(3000); // Default NestJS port
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();