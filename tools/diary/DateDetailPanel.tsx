"use client";

import { useState, useEffect, useRef } from "react";
import { useDiaryStore, CalendarEvent } from "./useDiaryStore";
import { JournalEditor } from "./JournalEditor";
import { EventEditor } from "./EventEditor";

interface DateDetailPanelProps {
  date: Date;
  onClose: () => void;
  initialEvent?: CalendarEvent | null;
}

type ViewMode = "overview" | "journal" | "event" | "editEvent";

export function DateDetailPanel({ date, onClose, initialEvent }: DateDetailPanelProps) {
  const { getEvents, getJournalEntry, deleteEvent } = useDiaryStore();
  const [viewMode, setViewMode] = useState<ViewMode>(initialEvent ? "editEvent" : "overview");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(initialEvent || null);
  
  // Update editing event when initialEvent changes
  useEffect(() => {
    if (initialEvent) {
      setEditingEvent(initialEvent);
      setViewMode("editEvent");
    } else {
      setEditingEvent(null);
      if (viewMode === "editEvent") {
        setViewMode("overview");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEvent]);

  // Reset to overview when date changes while in edit mode
  const prevDateRef = useRef<Date | null>(null);
  useEffect(() => {
    if (prevDateRef.current && prevDateRef.current.getTime() !== date.getTime()) {
      // Date changed - if we're in edit mode, reset to overview
      // This allows clicking away to update the sidebar when editing
      if (viewMode === "editEvent" || viewMode === "event" || viewMode === "journal") {
        setViewMode("overview");
        setEditingEvent(null);
      }
    }
    prevDateRef.current = date;
  }, [date, viewMode]);

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const dateKey = formatDateKey(date);
  const events = getEvents(dateKey).sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return 0;
    return a.time.localeCompare(b.time);
  });
  const entry = getJournalEntry(dateKey);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setViewMode("editEvent");
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      deleteEvent(event.id);
    }
  };

  if (viewMode === "journal") {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setViewMode("overview")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Journal Entry
          </h2>
        </div>
        <JournalEditor
          date={date}
          onClose={() => {
            setViewMode("overview");
            // Refresh the view by triggering a re-render
          }}
        />
      </div>
    );
  }

  if (viewMode === "event") {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => {
              setViewMode("overview");
              setEditingEvent(null);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            New Event
          </h2>
        </div>
        <EventEditor
          date={date}
          event={null}
          onClose={() => {
            setViewMode("overview");
            setEditingEvent(null);
            // Refresh the view by triggering a re-render
          }}
        />
      </div>
    );
  }

  if (viewMode === "editEvent" && editingEvent) {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => {
              setViewMode("overview");
              setEditingEvent(null);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Edit Event
          </h2>
        </div>
        <EventEditor
          date={date}
          event={editingEvent}
          onClose={() => {
            setViewMode("overview");
            setEditingEvent(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </h2>
          {(isToday(date) || isPast(date)) && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isToday(date) ? "Today" : "Past date"}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Events Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Events</h3>
            <button
              onClick={() => setViewMode("event")}
              className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Event
            </button>
          </div>
          {events.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
              No events scheduled
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border flex items-start justify-between group"
                  style={{
                    borderColor: event.color || "#9333ea",
                    backgroundColor: event.color ? `${event.color}20` : "#9333ea20",
                  }}
                >
                  <div className="flex-1">
                    {event.time && (
                      <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1 text-sm">
                        {event.time}
                      </div>
                    )}
                    <div className="font-medium text-lg" style={{ color: event.color || "#9333ea" }}>
                      {event.title}
                    </div>
                    {event.description && (
                      <div className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                        {event.description}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button
                      onClick={() => handleEditEvent(event)}
                      className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors"
                      aria-label="Edit event"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event)}
                      className="p-1.5 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors text-red-600"
                      aria-label="Delete event"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Journal Entry Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Journal Entry</h3>
            <button
              onClick={() => setViewMode("journal")}
              className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              {entry ? "Edit" : "Add"} Journal
            </button>
          </div>
          {entry ? (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {entry.content}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
              No journal entry for this day
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

