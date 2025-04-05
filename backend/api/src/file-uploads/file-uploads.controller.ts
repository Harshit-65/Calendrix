import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileUploadsService } from './file-uploads.service';
import * as path from 'path';
import * as fs from 'fs';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('uploads')
@Controller('uploads')
export class FileUploadsController {
  constructor(private readonly fileUploadsService: FileUploadsService) {}

  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file, callback) => {
      // Only allow image files
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validMimeTypes.includes(file.mimetype)) {
        return callback(new BadRequestException('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileUrl = this.fileUploadsService.getFileUrl(file.filename);
    
    return {
      filename: file.filename,
      url: fileUrl,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  @Post('video')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    fileFilter: (req, file, callback) => {
      // Only allow video files
      const validMimeTypes = ['video/mp4', 'video/webm', 'video/ogg'];
      if (!validMimeTypes.includes(file.mimetype)) {
        return callback(new BadRequestException('Invalid file type. Only MP4, WebM, and OGG are allowed.'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB limit
    },
  }))
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileUrl = this.fileUploadsService.getFileUrl(file.filename);
    
    return {
      filename: file.filename,
      url: fileUrl,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  // Serve uploaded files
  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(__dirname, '../../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }
    
    return res.sendFile(filePath);
  }
} 