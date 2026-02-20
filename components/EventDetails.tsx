import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, MapPin, AlignLeft, Calendar as CalendarIcon, Trash2, Save } from 'lucide-react';
import { Event } from '../types';

interface EventDetailsProps {
  event: Event;
  onSave: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onClose: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ event: initialEvent, onSave, onDelete, onClose }) => {
  const [event, setEvent] = useState<Event>(initialEvent);

  useEffect(() => {
    setEvent(initialEvent);
  }, [initialEvent]);

  const isDirty = useMemo(() => {
    return (
      event.title !== initialEvent.title ||
      event.date.toISOString().split('T')[0] !== initialEvent.date.toISOString().split('T')[0] ||
      event.startTime !== initialEvent.startTime ||
      event.endTime !== initialEvent.endTime ||
      event.description !== initialEvent.description ||
      event.location !== initialEvent.location ||
      event.color !== initialEvent.color ||
      event.category !== initialEvent.category
    );
  }, [event, initialEvent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEvent(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      setEvent(prev => ({ ...prev, date }));
    }
  };

  const handleSave = () => {
    onSave(event);
  };

  const handleDelete = () => {
    if (event.id) {
      onDelete(event.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Event Details</h2>
            {isDirty && (
              <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full border border-yellow-200 animate-pulse">
                Unsaved changes
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <input
              type="text"
              name="title"
              value={event.title}
              onChange={handleChange}
              placeholder="Event Title"
              className="w-full text-lg font-medium border-b-2 border-gray-200 focus:border-blue-500 outline-none py-2 px-1 transition-colors"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-600 w-1/2">
              <CalendarIcon size={18} className="mr-2" />
              <input
                type="date"
                name="date"
                value={event.date.toISOString().split('T')[0]}
                onChange={handleDateChange}
                className="w-full bg-transparent border-none focus:ring-0 text-sm"
              />
            </div>
            <div className="flex items-center text-gray-600 w-1/2">
              <Clock size={18} className="mr-2" />
              <input
                type="time"
                name="startTime"
                value={event.startTime}
                onChange={handleChange}
                className="bg-transparent border-none focus:ring-0 text-sm w-16"
              />
              <span className="mx-1">-</span>
              <input
                type="time"
                name="endTime"
                value={event.endTime}
                onChange={handleChange}
                className="bg-transparent border-none focus:ring-0 text-sm w-16"
              />
            </div>
          </div>

          <div className="flex items-center text-gray-600">
            <MapPin size={18} className="mr-2" />
            <input
              type="text"
              name="location"
              value={event.location}
              onChange={handleChange}
              placeholder="Add location"
              className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400"
            />
          </div>

          <div className="flex items-start text-gray-600">
            <AlignLeft size={18} className="mr-2 mt-1" />
            <textarea
              name="description"
              value={event.description}
              onChange={handleChange}
              placeholder="Add description"
              className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400 resize-none h-24"
            />
          </div>

          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select
                name="category"
                value={event.category}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="family">Family</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="w-1/2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
              <div className="flex space-x-2">
                {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setEvent(prev => ({ ...prev, color }))}
                    className={`w-6 h-6 rounded-full focus:outline-none transition-transform ${event.color === color ? 'scale-125 ring-2 ring-offset-1 ring-gray-300' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
          {initialEvent.id && (
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors mr-auto"
            >
              <Trash2 size={18} className="mr-2" />
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Save size={18} className="mr-2" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;