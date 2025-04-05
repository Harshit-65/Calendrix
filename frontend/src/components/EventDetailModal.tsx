import React from 'react';
import { Event } from '@/types/event';

interface EventDetailModalProps {
  event: Event;
  onClose: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  // Extract YouTube ID
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Show appropriate video player
  const renderVideo = (url: string) => {
    if (!url) return null;
    
    const youtubeVideoId = getYouTubeVideoId(url);
    
    if (youtubeVideoId) {
      // YouTube embed
      return (
        <div className="w-full">
          <iframe
            width="100%"
            height="400"
            src={`https://www.youtube.com/embed/${youtubeVideoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded"
          ></iframe>
        </div>
      );
    } else {
      // Local video
      return (
        <div className="max-h-[50vh]">
          <video 
            src={url} 
            controls 
            className="w-full h-full max-h-[400px] rounded object-contain"
          />
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 max-h-[90vh] relative overflow-hidden flex flex-col">
        {/* Header with close button */}
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
          <h2 className="text-2xl font-semibold text-gray-700 truncate pr-8">{event.title}</h2>
          <button 
            onClick={onClose}
            className="absolute top-0 right-0 p-4 text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>
        
        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 pr-2">
          <div className="mb-4">
            {event.description && <p className="text-gray-600 mb-4">{event.description}</p>}
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Starts:</span> {new Date(event.startTime).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-semibold">Ends:</span> {new Date(event.endTime).toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-4">
            {event.imageURL && (
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Image</h3>
                <div className="bg-gray-100 p-2 rounded">
                  <img 
                    src={event.imageURL} 
                    alt={event.title} 
                    className="max-h-[50vh] w-full object-contain rounded" 
                  />
                </div>
              </div>
            )}
            
            {event.videoURL && (
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Video</h3>
                <div className="bg-gray-100 p-2 rounded">
                  {renderVideo(event.videoURL)}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-4 pt-2 border-t flex justify-end sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal; 