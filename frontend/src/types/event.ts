export interface Event {
    id: string;
    title: string;
    description?: string; // Optional
    startTime: string; // ISO Date string
    endTime: string; // ISO Date string
    imageURL?: string; // Optional
    videoURL?: string; // Optional
    createdAt: string; // ISO Date string
    updatedAt: string; // ISO Date string
  }