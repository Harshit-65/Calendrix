import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Query } from '@nestjs/common';
import { EventsService, EventsQueryParams } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from './entities/event.entity'; // Import the Event entity type
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger'; // Optional: For Swagger

@ApiTags('events') // Group endpoints in Swagger UI
@Controller('events') // Base route for all methods in this controller
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ status: 201, description: 'The event has been successfully created.', type: Event })
  @ApiResponse({ status: 400, description: 'Bad Request (validation failed)' })
  create(@Body() createEventDto: CreateEventDto): Event {
    // Validation is handled automatically by ValidationPipe (see Step 8)
    return this.eventsService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events with optional filtering' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for title or description' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by minimum start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by maximum start date (ISO format)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['startTime', 'endTime', 'createdAt', 'title'], description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (ascending or descending)' })
  @ApiResponse({ status: 200, description: 'Return filtered events.', type: [Event] })
  findAll(
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: 'startTime' | 'endTime' | 'createdAt' | 'title',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Event[] {
    const queryParams: EventsQueryParams = {
      search,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    };
    return this.eventsService.findAll(queryParams);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single event by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the event to retrieve', type: String })
  @ApiResponse({ status: 200, description: 'Return the event.', type: Event })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Event {
    // ParseUUIDPipe validates that the ID parameter is a valid UUID
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing event' })
  @ApiParam({ name: 'id', description: 'UUID of the event to update', type: String })
  @ApiBody({ type: UpdateEventDto })
  @ApiResponse({ status: 200, description: 'The event has been successfully updated.', type: Event })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request (validation failed)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto
  ): Event {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  @ApiParam({ name: 'id', description: 'UUID of the event to delete', type: String })
  @ApiResponse({ status: 204, description: 'The event has been successfully deleted.' }) // 204 No Content is common for DELETE
  @ApiResponse({ status: 404, description: 'Event not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string): void {
     // Consider returning status 204 No Content on success, which means no response body
     // For simplicity now, NestJS default might be 200 OK if the method doesn't explicitly set status
    this.eventsService.remove(id);
    // To explicitly return 204, you can add @HttpCode(204) decorator to the method
  }
}