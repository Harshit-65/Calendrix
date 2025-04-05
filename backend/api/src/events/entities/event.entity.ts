import { ApiProperty } from '@nestjs/swagger'; // Optional: for Swagger documentation if you add it later

export class Event {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8', description: 'Unique Identifier (UUID)' })
  id: string;

  @ApiProperty({ example: 'Team Meeting', description: 'Title of the event' })
  title: string;

  @ApiProperty({ example: 'Discuss project progress', description: 'Optional description', required: false })
  description?: string; // Optional property

  @ApiProperty({ example: '2025-04-10T10:00:00.000Z', description: 'Event start time in ISO 8601 format' })
  startTime: string; // ISO string format

  @ApiProperty({ example: '2025-04-10T11:00:00.000Z', description: 'Event end time in ISO 8601 format' })
  endTime: string; // ISO string format

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'URL for event image', required: false })
  imageURL?: string; // Optional property

  @ApiProperty({ example: 'https://example.com/video.mp4', description: 'URL for event video', required: false })
  videoURL?: string; // Optional property

  @ApiProperty({ description: 'Timestamp of creation' })
  createdAt: string; // ISO string format

  @ApiProperty({ description: 'Timestamp of last update' })
  updatedAt: string; // ISO string format
}