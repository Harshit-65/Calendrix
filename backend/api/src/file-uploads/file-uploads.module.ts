import { Module } from '@nestjs/common';
import { FileUploadsController } from '../file-uploads/file-uploads.controller';
import { FileUploadsService } from '../file-uploads/file-uploads.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          // Generate unique filename with original extension
          const uniqueSuffix = uuidv4();
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // Default 10MB limit
      },
    }),
  ],
  controllers: [FileUploadsController],
  providers: [FileUploadsService],
})
export class FileUploadsModule {} 