"use client";

import { useState, useEffect } from "react";
import { useDiaryStore, CalendarEvent } from "./useDiaryStore";

interface EventEditorProps {
  date: Date;
  event?: CalendarEvent | null;
  onClose: () => void;
}

const EVENT_COLORS = [
  "#9333ea", // purple
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#06b6d4", // cyan
];

export function EventEditor({ date, event, onClose }: EventEditorProps) {
  const { addEvent, updateEvent, deleteEvent } = useDiaryStore();
  
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [time, setTime] = useState(event?.time || "");
  const [color, setColor] = useState(event?.color || EVENT_COLORS[0]);
  
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setTime(event.time || "");
      setColor(event.color || EVENT_COLORS[0]);
    } else {
      setTitle("");
      setDescription("");
      setTime("");
      setColor(EVENT_COLORS[0]);
    }
  }, [event]);
  
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  
  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a title for the event");
      return;
    }
    
    const dateKey = formatDateKey(date);
    
    if (event) {
      updateEvent(event.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        time: time.trim() || undefined,
        color,
      });
    } else {
      addEvent({
        date: dateKey,
        title: title.trim(),
        description: description.trim() || undefined,
        time: time.trim() || undefined,
        color,
      });
    }
    
    onClose();
  };
  
  const handleDelete = () => {
    if (event) {
      if (confirm("Are you sure you want to delete this event?")) {
        deleteEvent(event.id);
        onClose();
      }
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {event ? "Edit Event" : "New Event"} - {date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </h2>
      </div>
      
      <div className="flex-1 flex flex-col space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time (optional)
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Event description"
            rows={4}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Color
          </label>
          <div className="flex gap-2">
            {EVENT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c ? "border-gray-900 dark:border-gray-100 scale-110" : "border-gray-300 dark:border-gray-600"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          {event ? "Update" : "Create"}
        </button>
        {event && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Delete
          </button>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

