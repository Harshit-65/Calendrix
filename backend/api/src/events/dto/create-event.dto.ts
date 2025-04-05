import { IsString, IsNotEmpty, IsOptional, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger'; // Optional

export class CreateEventDto {
  @ApiProperty({ example: 'Team Meeting', description: 'Title of the event', minLength: 3 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @ApiProperty({ example: 'Discuss project progress', description: 'Optional description', required: false })
  @IsString()
  @IsOptional() // Makes this field optional
  description?: string;

  @ApiProperty({ example: '2025-04-10T10:00:00.000Z', description: 'Event start time (ISO 8601 format)' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '2025-04-10T11:00:00.000Z', description: 'Event end time (ISO 8601 format)' })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: 'http://localhost:3000/uploads/image.jpg', description: 'URL for event image', required: false })
  @IsString()
  @IsOptional()
  imageURL?: string;

  @ApiProperty({ example: 'http://localhost:3000/uploads/video.mp4', description: 'URL for event video', required: false })
  @IsString()
  @IsOptional()
  videoURL?: string;
}