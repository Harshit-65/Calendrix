import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { FileUploadsModule } from './file-uploads/file-uploads.module';

@Module({
  imports: [EventsModule, FileUploadsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
