import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { FileUploadsService } from '../file-uploads/file-uploads.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService, FileUploadsService],
})
export class EventsModule {}
