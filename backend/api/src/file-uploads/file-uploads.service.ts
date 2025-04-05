import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadsService {
  private readonly uploadsPath = path.join(__dirname, '../../uploads');

  // Get full URL for accessing a file
  getFileUrl(filename: string): string {
    return `http://localhost:3000/uploads/${filename}`;
  }

  // Remove a file from the uploads directory
  deleteFile(fileUrl: string): boolean {
    try {
      const filename = path.basename(fileUrl);
      const filePath = path.join(this.uploadsPath, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
} 