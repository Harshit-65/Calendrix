import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import { FileUploadsService } from '../file-uploads/file-uploads.service';

// Define a query parameters interface for filtering events
export interface EventsQueryParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'startTime' | 'endTime' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class EventsService {
  // Simple in-memory store
  private readonly events: Event[] = [];

  constructor(private readonly fileUploadsService: FileUploadsService) {}

  create(createEventDto: CreateEventDto): Event {
    const now = new Date().toISOString();
    const newEvent: Event = {
      id: uuidv4(), // Generate a unique ID
      ...createEventDto, // Spread properties from DTO
      createdAt: now,
      updatedAt: now,
    };
    this.events.push(newEvent);
    return newEvent;
  }

  findAll(queryParams: EventsQueryParams = {}): Event[] {
    let filteredEvents = [...this.events];
    
    // Search by title or description
    if (queryParams.search) {
      const searchTerm = queryParams.search.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(searchTerm) || 
        (event.description && event.description.toLowerCase().includes(searchTerm))
      );
    }
    
    // Filter by date range
    if (queryParams.startDate) {
      const startDate = new Date(queryParams.startDate);
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.startTime) >= startDate
      );
    }
    
    if (queryParams.endDate) {
      const endDate = new Date(queryParams.endDate);
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.startTime) <= endDate
      );
    }
    
    // Sort events
    if (queryParams.sortBy) {
      const sortField = queryParams.sortBy;
      const sortOrder = queryParams.sortOrder || 'asc';
      
      filteredEvents.sort((a, b) => {
        let valueA: string | Date = a[sortField];
        let valueB: string | Date = b[sortField];
        
        // Handle date fields
        if (['startTime', 'endTime', 'createdAt', 'updatedAt'].includes(sortField)) {
          valueA = new Date(valueA);
          valueB = new Date(valueB);
        }
        
        // Compare based on sort order
        if (sortOrder === 'asc') {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    }
    
    return filteredEvents;
  }

  findOne(id: string): Event {
    const event = this.events.find((event) => event.id === id);
    if (!event) {
      // Throw standard NestJS exception if not found
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    return event;
  }

  update(id: string, updateEventDto: UpdateEventDto): Event {
    const eventIndex = this.events.findIndex((event) => event.id === id);
    if (eventIndex === -1) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }

    const existingEvent = this.events[eventIndex];

    // Create the updated event object
    const updatedEvent: Event = {
      ...existingEvent, // Keep existing properties
      ...updateEventDto, // Overwrite with properties from DTO
      updatedAt: new Date().toISOString(), // Update the timestamp
    };

    // Basic validation: Ensure startTime is before endTime if both are provided
    const checkStartTime = updatedEvent.startTime;
    const checkEndTime = updatedEvent.endTime;
    if (new Date(checkStartTime) >= new Date(checkEndTime)) {
        throw new Error('Start time must be before end time'); // Or use BadRequestException
    }

    // If image/video URL was changed, delete the old file
    if (updateEventDto.imageURL && existingEvent.imageURL !== updateEventDto.imageURL) {
      this.tryDeleteFile(existingEvent.imageURL);
    }
    
    if (updateEventDto.videoURL && existingEvent.videoURL !== updateEventDto.videoURL) {
      this.tryDeleteFile(existingEvent.videoURL);
    }

    this.events[eventIndex] = updatedEvent;
    return updatedEvent;
  }

  remove(id: string): void {
    const eventIndex = this.events.findIndex((event) => event.id === id);
    if (eventIndex === -1) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    
    // Delete associated files if they exist
    const event = this.events[eventIndex];
    this.tryDeleteFile(event.imageURL);
    this.tryDeleteFile(event.videoURL);
    
    this.events.splice(eventIndex, 1); // Remove the event from the array
  }
  
  // Only delete files we're hosting
  private tryDeleteFile(fileUrl: string | undefined): void {
    if (fileUrl && fileUrl.includes('localhost:3000/uploads/')) {
      this.fileUploadsService.deleteFile(fileUrl);
    }
  }
}