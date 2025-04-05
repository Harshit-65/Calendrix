'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { Event } from '@/types/event';
import { getEvents, createEvent, deleteEvent, updateEvent, CreateEventData, uploadImage, uploadVideo, EventsQueryParams } from '@/services/api';
import EventDetailModal from '@/components/EventDetailModal';

// Browser notification support check
const checkNotificationsPermission = async () => {
  if (!('Notification' in window)) {
    alert('This browser does not support desktop notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export default function Home() {
  // State management
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<CreateEventData>({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    imageURL: '',
    videoURL: '',
  });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'startTime' | 'endTime' | 'createdAt' | 'title'>('startTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  const activeNotifications = useRef<{[key: string]: Notification}>({});

  // Clear form and set defaults
  const resetEventForm = () => {
    const now = new Date();
    
    const roundedHour = new Date(now);
    roundedHour.setMinutes(0, 0, 0);
    roundedHour.setHours(roundedHour.getHours() + 1);
    
    const oneHourLater = new Date(roundedHour);
    oneHourLater.setHours(oneHourLater.getHours() + 1);
    
    const formatDateForInput = (date: Date) => {
      return date.toISOString().slice(0, 16);
    };
    
    setEventData({
      title: '',
      description: '',
      startTime: formatDateForInput(roundedHour),
      endTime: formatDateForInput(oneHourLater),
      imageURL: '',
      videoURL: '',
    });

    setEditingEventId(null);
  };

  // Apply search and filters
  const fetchEvents = async (params?: EventsQueryParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEvents = await getEvents(params);
      setEvents(fetchedEvents);
    } catch (err) {
      setError('Failed to load events.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch events with current search/filter settings
  const applyFilters = () => {
    const params: EventsQueryParams = {};
    
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    
    if (filterStartDate) {
      params.startDate = filterStartDate;
    }
    
    if (filterEndDate) {
      params.endDate = filterEndDate;
    }
    
    params.sortBy = sortBy;
    params.sortOrder = sortOrder;
    
    fetchEvents(params);
    setShowFilterModal(false);
  };
  
  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle search submission
  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    applyFilters();
  };
  
  // Handle filter reset
  const resetFilters = () => {
    setSearchTerm('');
    setFilterStartDate('');
    setFilterEndDate('');
    setSortBy('startTime');
    setSortOrder('asc');
    fetchEvents();
    setShowFilterModal(false);
  };

  // Fetch events on load
  useEffect(() => {
    fetchEvents();
    
    return () => {
      Object.values(activeNotifications.current).forEach(notification => {
        notification.close();
      });
    };
  }, []);

  // Setup event notifications
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    events.forEach(event => {
      const eventTime = new Date(event.startTime).getTime();
      const currentTime = new Date().getTime();
      
      if (eventTime > currentTime) {
        const timeUntilEvent = eventTime - currentTime;
        
        const timer = setTimeout(() => {
          showEventNotification(event);
        }, timeUntilEvent);
        
        timers.push(timer);
      }
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [events]);

  // Display event notification
  const showEventNotification = async (event: Event) => {
    const hasPermission = await checkNotificationsPermission();
    
    if (!hasPermission) {
      console.warn('Notification permission denied');
      return;
    }
    
    const notification = new Notification(`Event: ${event.title}`, {
      body: event.description || 'Your scheduled event is now.',
      icon: event.imageURL || '/calendrix-icon.png',
      silent: false
    });
    
    activeNotifications.current[event.id] = notification;
    
    notification.onclick = () => {
      window.focus();
      notification.close();
      delete activeNotifications.current[event.id];
    };
    
    notification.addEventListener('close', () => {
      delete activeNotifications.current[event.id];
    });
    
    // Add snooze option
    setTimeout(() => {
      if (activeNotifications.current[event.id]) {
        notification.close();
        
        const snoozeNotification = new Notification('Snooze event?', {
          body: `Click to snooze "${event.title}" for 5 minutes`,
          icon: '/calendrix-icon.png',
          requireInteraction: true
        });
        
        snoozeNotification.onclick = () => {
          snoozeNotification.close();
          
          setTimeout(() => {
            showEventNotification(event);
          }, 5 * 60 * 1000);
        };
      }
    }, 10000);
  };

  // Form input handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEventData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle file uploads
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size
    const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    const MAX_VIDEO_SIZE = 20 * 1024 * 1024;
    
    const maxSize = fileType === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      const errorMsg = fileType === 'video' 
        ? `Video size exceeds the limit (${maxSizeMB}MB). Please choose a smaller file or use a YouTube URL instead.`
        : `Image size exceeds the limit (${maxSizeMB}MB). Please choose a smaller file.`;
      
      setError(errorMsg);
      e.target.value = '';
      return;
    }
    
    try {
      setError('Uploading file to server...');
      
      const uploadFunction = fileType === 'image' ? uploadImage : uploadVideo;
      const response = await uploadFunction(file);
      
      setEventData(prev => ({
        ...prev,
        [fileType === 'image' ? 'imageURL' : 'videoURL']: response.url
      }));
      
      setError(null);
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      setError(`Failed to upload ${fileType}. Please try again or use a different file.`);
      e.target.value = '';
    }
  };

  // Save event handler 
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!eventData.title || !eventData.startTime || !eventData.endTime) {
      setError("Title, Start Time, and End Time are required.");
      return;
    }
    
    const startTime = new Date(eventData.startTime);
    const endTime = new Date(eventData.endTime);
    const now = new Date();
    
    if (startTime < now) {
      setError('Start Time cannot be in the past.');
      return;
    }
    
    if (startTime >= endTime) {
      setError('End Time must be after Start Time.');
      return;
    }

    try {
      const cleanEventData = { ...eventData };
      
      // Handle local files
      const localImageFile = cleanEventData.imageURL?.startsWith('data:') ? cleanEventData.imageURL : null;
      const localVideoFile = cleanEventData.videoURL?.startsWith('data:') ? cleanEventData.videoURL : null;
      
      if (!cleanEventData.imageURL?.trim() || cleanEventData.imageURL?.startsWith('data:')) {
        delete cleanEventData.imageURL;
      }
      
      if (!cleanEventData.videoURL?.trim() || cleanEventData.videoURL?.startsWith('data:')) {
        delete cleanEventData.videoURL;
      }
      
      let updatedOrNewEvent: Event;
      
      if (editingEventId) {
        updatedOrNewEvent = await updateEvent(editingEventId, cleanEventData);
      } else {
        updatedOrNewEvent = await createEvent(cleanEventData);
      }
      
      // Add back local files
      if (localImageFile) {
        updatedOrNewEvent.imageURL = localImageFile;
      }
      
      if (localVideoFile) {
        updatedOrNewEvent.videoURL = localVideoFile;
      }
      
      // Update UI
      if (editingEventId) {
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === editingEventId ? updatedOrNewEvent : event
          )
        );
      } else {
        setEvents(prevEvents => [...prevEvents, updatedOrNewEvent]);
      }
      
      resetEventForm();
      setShowModal(false);
      
      // Refresh events with current filters
      applyFilters();
    } catch (err: any) {
      setError(err.message || 'Failed to save event.');
      console.error(err);
    }
  };

  // Delete event handler
  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent(id);
      setEvents(events.filter(event => event.id !== id));
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError('Failed to delete event.');
    }
  };

  // Edit event handler
  const handleEditEvent = (event: Event) => {
    checkNotificationsPermission();
    
    const formatDateForInput = (dateString: string) => {
      return new Date(dateString).toISOString().slice(0, 16);
    };
    
    setEventData({
      title: event.title,
      description: event.description || '',
      startTime: formatDateForInput(event.startTime),
      endTime: formatDateForInput(event.endTime),
      imageURL: event.imageURL || '',
      videoURL: event.videoURL || '',
    });
    
    setEditingEventId(event.id);
    setShowModal(true);
  };

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Create event on date click
  const handleDateClick = (date: Date) => {
    const now = new Date();
    
    if (date < new Date(now.setHours(0, 0, 0, 0))) {
      return;
    }
    
    checkNotificationsPermission();
    setSelectedDate(date);
    
    // Set default times
    const startTime = new Date(date);
    startTime.setHours(Math.max(now.getHours() + 1, 9), 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);
    
    const formatDateForInput = (date: Date) => {
      return date.toISOString().slice(0, 16);
    };
    
    setEditingEventId(null);
    
    setEventData({
      title: '',
      description: '',
      startTime: formatDateForInput(startTime),
      endTime: formatDateForInput(endTime),
      imageURL: '',
      videoURL: '',
    });
    
    setShowModal(true);
  };

  // Calendar view generator
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Empty cells for days before month starts
    const blanks = Array(dayOfWeek).fill(null).map((_, index) => (
      <div key={`blank-${index}`} className="calendar-day empty"></div>
    ));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create days of the month
    const days = Array(daysInMonth).fill(null).map((_, index) => {
      const day = index + 1;
      const date = new Date(year, month, day);
      const isPast = date < today;
      
      // Find events for this day
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.getDate() === day && 
               eventDate.getMonth() === month && 
               eventDate.getFullYear() === year;
      });
      
      return (
        <div 
          key={`day-${day}`} 
          className={`calendar-day ${isPast ? 'past' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
          onClick={() => !isPast && handleDateClick(date)}
        >
          <div className="day-number">{day}</div>
          {dayEvents.length > 0 && (
            <div className="event-indicator">
              {dayEvents.length > 1 ? `${dayEvents.length} events` : '1 event'}
            </div>
          )}
        </div>
      );
    });
    
    const calendarDays = [...blanks, ...days];
    
    return (
      <div className="calendar">
        <div className="calendar-header">
          <button 
            onClick={goToPreviousMonth}
            className="calendar-nav-btn"
          >
            &lt;
          </button>
          <h2>{monthNames[month]} {year}</h2>
          <button 
            onClick={goToNextMonth}
            className="calendar-nav-btn"
          >
            &gt;
          </button>
        </div>
        <button 
          onClick={goToToday}
          className="today-btn"
        >
          Today
        </button>
        <div className="calendar-days-header">
          {dayNames.map(day => (
            <div key={day} className="day-name">{day}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {calendarDays}
        </div>
      </div>
    );
  };

  // Render a single event card
  const renderEvent = (event: Event) => {
    const isYouTubeUrl = (url: string) => {
      if (!url) return false;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      return regExp.test(url);
    };

    return (
      <li key={event.id} className="p-4 bg-white rounded-lg shadow mb-4">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => handleEditEvent(event)}
              className="text-blue-500 hover:text-blue-700"
            >
              Edit
            </button>
            <button 
              onClick={() => handleDeleteEvent(event.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </div>
        {event.description && <p className="text-gray-600 mt-1 line-clamp-2">{event.description}</p>}
        <p className="text-sm text-gray-500 mt-2">
          Starts: {new Date(event.startTime).toLocaleString()}
        </p>
        <p className="text-sm text-gray-500">
          Ends: {new Date(event.endTime).toLocaleString()}
        </p>
        
        {/* Media thumbnails */}
        {(event.imageURL || event.videoURL) && (
          <div className="mt-3 flex space-x-3">
            {event.imageURL && (
              <button
                onClick={() => setSelectedEvent(event)}
                className="h-16 w-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center border border-gray-200 hover:border-blue-500"
                title="View full image"
              >
                <img 
                  src={event.imageURL} 
                  alt={`Thumbnail for ${event.title}`} 
                  className="h-full w-full object-cover"
                />
              </button>
            )}
            
            {event.videoURL && (
              <button
                onClick={() => setSelectedEvent(event)}
                className="h-16 w-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center border border-gray-200 hover:border-blue-500"
                title="View video"
              >
                <div className="flex flex-col items-center justify-center text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        )}
      </li>
    );
  };

  // Event filtering
  const getTodayEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= today && eventDate < tomorrow;
    });
  };

  const getFutureEvents = () => {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= tomorrow;
    });
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-10 bg-gray-50">
      {/* Header with title and search */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">Calendrix</h1>
        
        <div className="flex items-center">
          <form onSubmit={handleSearchSubmit} className="relative mr-2">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search events..."
              className="px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <img 
                src="/icons8-search-128.png" 
                alt="Search" 
                className="w-6 h-6"
              />
            </button>
          </form>
          
          <button 
            onClick={() => setShowFilterModal(true)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md border border-gray-300"
          >
            Filters
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left side - Calendar */}
        <section className="w-full lg:w-1/2">
          <div className="bg-white rounded-lg shadow-md p-4">
            {renderCalendar()}
          </div>
        </section>

        {/* Right side - Events */}
        <section className="w-full lg:w-1/2">
          {/* Today's Events */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Today's Events
            </h2>
            {isLoading && <p className="text-gray-500">Loading events...</p>}
            {!isLoading && getTodayEvents().length === 0 && (
              <p className="text-gray-500">No events scheduled for today.</p>
            )}
            {!isLoading && getTodayEvents().length > 0 && (
              <div className="max-h-[400px] overflow-y-auto pr-2">
                <ul>
                  {getTodayEvents().map(event => renderEvent(event))}
                </ul>
              </div>
            )}
          </div>

          {/* Future Events */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Future Events
            </h2>
            {isLoading && <p className="text-gray-500">Loading events...</p>}
            {!isLoading && getFutureEvents().length === 0 && (
              <p className="text-gray-500">No future events scheduled.</p>
            )}
            {!isLoading && getFutureEvents().length > 0 && (
              <div className="max-h-[400px] overflow-y-auto pr-2">
                <ul>
                  {getFutureEvents().map(event => renderEvent(event))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Event Creation/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-700">
                {editingEventId 
                  ? `Edit Event on ${new Date(eventData.startTime).toLocaleDateString()}` 
                  : `Add Event on ${selectedDate?.toLocaleDateString()}`}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false); 
                  resetEventForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {error && <p className="mb-4 text-red-500 bg-red-100 p-3 rounded">{error}</p>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-600 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={eventData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={eventData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-600 mb-1">Start Time <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    name="startTime"
                    value={eventData.startTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-600 mb-1">End Time <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    name="endTime"
                    value={eventData.endTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              {/* Media Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="imageFile" className="block text-sm font-medium text-gray-600 mb-1">Image</label>
                  <input
                    type="file"
                    id="imageFile"
                    name="imageFile"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'image')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max size: 5MB (stored on server)</p>
                </div>
                <div>
                  <label htmlFor="videoFile" className="block text-sm font-medium text-gray-600 mb-1">Video</label>
                  <p className="text-xs text-gray-500 mb-2">
                    <strong>Recommended:</strong> Use YouTube URL for best performance
                  </p>
                  <input
                    type="url"
                    id="videoURL"
                    name="videoURL"
                    value={eventData.videoURL}
                    onChange={handleInputChange}
                    placeholder="Enter YouTube URL (recommended)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-2"
                  />
                  <p className="text-xs text-gray-500 mb-1">Or upload directly:</p>
                  <input
                    type="file"
                    id="videoFile"
                    name="videoFile"
                    accept="video/*"
                    onChange={(e) => handleFileChange(e, 'video')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max size: 20MB (stored on server)</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetEventForm();
                  }}
                  className="px-4 py-2 font-semibold text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingEventId ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Filters Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Filter Events</h2>
              <button 
                onClick={() => setShowFilterModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Date Filters */}
              <div>
                <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-600 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  id="filterStartDate"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-600 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  id="filterEndDate"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Sort Options */}
              <div>
                <label htmlFor="sortBy" className="block text-sm font-medium text-gray-600 mb-1">
                  Sort By
                </label>
                <select
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="startTime">Start Time</option>
                  <option value="endTime">End Time</option>
                  <option value="createdAt">Created Date</option>
                  <option value="title">Title</option>
                </select>
              </div>
              <div>
                <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-600 mb-1">
                  Sort Order
                </label>
                <select
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </main>
  );
}