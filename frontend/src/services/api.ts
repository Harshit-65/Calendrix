import { Event } from '@/types/event'; // Using the alias configured during setup

// Adjust if your backend runs on a different port
const API_BASE_URL = 'http://localhost:3000';

// Data needed to create/update events 
export type CreateEventData = Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;

// Response format for uploaded files
export type UploadedFileResponse = {
  filename: string;
  url: string;
  mimetype: string;
  size: number;
};

// Search and filter parameters
export interface EventsQueryParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'startTime' | 'endTime' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Fetch all events with optional filtering
export const getEvents = async (queryParams?: EventsQueryParams): Promise<Event[]> => {
  try {
    // Build query string from params
    let queryString = '';
    if (queryParams) {
      const params = new URLSearchParams();
      
      if (queryParams.search) {
        params.append('search', queryParams.search);
      }
      
      if (queryParams.startDate) {
        params.append('startDate', queryParams.startDate);
      }
      
      if (queryParams.endDate) {
        params.append('endDate', queryParams.endDate);
      }
      
      if (queryParams.sortBy) {
        params.append('sortBy', queryParams.sortBy);
      }
      
      if (queryParams.sortOrder) {
        params.append('sortOrder', queryParams.sortOrder);
      }
      
      const paramsString = params.toString();
      if (paramsString) {
        queryString = `?${paramsString}`;
      }
    }
    
    const response = await fetch(`${API_BASE_URL}/events${queryString}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const events: Event[] = await response.json();
    return events;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    // In a real app, handle this more gracefully (e.g., show error to user)
    return []; // Empty array on error
  }
};

// Create a new event
export const createEvent = async (eventData: CreateEventData): Promise<Event> => {
  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
        // Try to get error details from backend response body
        const errorBody = await response.json();
        console.error("Backend validation error:", errorBody);
        throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
    }

    const newEvent: Event = await response.json();
    return newEvent;
  } catch (error) {
    console.error("Failed to create event:", error);
    // Re-throw the error to be caught by the calling component
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Most DELETE operations return empty response with 204 status
    // Nothing to return in this case
  } catch (error) {
    console.error("Failed to delete event:", error);
    throw error; // Re-throw to be handled by component
  }
};

// Update an existing event
export const updateEvent = async (id: string, eventData: Partial<CreateEventData>): Promise<Event> => {
  try {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      // Try to get error details from backend response body
      const errorBody = await response.json();
      console.error("Backend validation error:", errorBody);
      throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
    }

    const updatedEvent: Event = await response.json();
    return updatedEvent;
  } catch (error) {
    console.error("Failed to update event:", error);
    // Re-throw the error to be caught by the calling component
    throw error;
  }
};

// Upload an image file
export const uploadImage = async (file: File): Promise<UploadedFileResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/uploads/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to upload image:", error);
    throw error;
  }
};

// Upload a video file
export const uploadVideo = async (file: File): Promise<UploadedFileResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/uploads/video`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to upload video:", error);
    throw error;
  }
};