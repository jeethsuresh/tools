"use client";

import { useDiaryStore } from "./useDiaryStore";
import { CalendarEvent } from "./useDiaryStore";

interface CalendarViewsProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onDateDoubleClick?: (date: Date) => void;
  selectedDate: Date | null;
  onEventClick?: (event: CalendarEvent, date: Date) => void;
}

export function MonthView({ currentDate, onDateSelect, onDateDoubleClick, selectedDate, onEventClick }: CalendarViewsProps) {
  const { getEvents, getJournalEntry } = useDiaryStore();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const days: (Date | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  const isPast = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };
  
  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return formatDateKey(date) === formatDateKey(selectedDate);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }
          
          const dateKey = formatDateKey(date);
          const events = getEvents(dateKey);
          const entry = getJournalEntry(dateKey);
          const today = isToday(date);
          const past = isPast(date);
          const selected = isSelected(date);
          
          return (
            <button
              key={dateKey}
              onClick={() => onDateSelect(date)}
              onDoubleClick={() => onDateDoubleClick?.(date)}
              className={`
                aspect-square p-1 border rounded-lg text-left
                transition-colors hover:bg-gray-100 dark:hover:bg-gray-800
                ${today ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700"}
                ${selected ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20" : ""}
                ${past ? "opacity-50" : ""}
                flex flex-col overflow-hidden
              `}
            >
              <div className={`text-sm font-medium ${today ? "text-blue-600 dark:text-blue-400" : past ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"}`}>
                {date.getDate()}
              </div>
              <div className="flex-1 overflow-hidden mt-1">
                {events.length > 0 && (
                  <div className="space-y-0.5">
                    {events.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event, date);
                        }}
                        className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                        style={{
                          backgroundColor: event.color ? `${event.color}20` : "#9333ea20",
                          color: event.color || "#9333ea",
                        }}
                        title={event.title}
                      >
                        {event.time && `${event.time} `}
                        {event.title}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{events.length - 2} more
                      </div>
                    )}
                  </div>
                )}
                {entry && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Journal
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WeekView({ currentDate, onDateSelect, onDateDoubleClick, selectedDate, onEventClick }: CalendarViewsProps) {
  const { getEvents, getJournalEntry } = useDiaryStore();
  
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDays.push(date);
  }
  
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  
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
  
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return formatDateKey(date) === formatDateKey(selectedDate);
  };
  
  const formatDayName = (date: Date) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[date.getDay()];
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-7 gap-2 flex-1">
        {weekDays.map((date) => {
          const dateKey = formatDateKey(date);
          const events = getEvents(dateKey);
          const entry = getJournalEntry(dateKey);
          const today = isToday(date);
          const past = isPast(date);
          const selected = isSelected(date);
          
          return (
            <div
              key={dateKey}
              onDoubleClick={() => onDateDoubleClick?.(date)}
              className={`
                border rounded-lg p-3 flex flex-col
                ${today ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700"}
                ${selected ? "ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20" : ""}
                ${past ? "opacity-50" : ""}
              `}
            >
              <button
                onClick={() => onDateSelect(date)}
                className="text-left mb-2"
              >
                <div className={`text-sm font-semibold ${today ? "text-blue-600 dark:text-blue-400" : past ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"}`}>
                  {formatDayName(date)}
                </div>
                <div className={`text-lg font-bold ${today ? "text-blue-600 dark:text-blue-400" : past ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"}`}>
                  {date.getDate()}
                </div>
                <div className={`text-xs ${past ? "text-gray-400 dark:text-gray-500" : "text-gray-500 dark:text-gray-400"}`}>
                  {date.toLocaleDateString("en-US", { month: "short" })}
                </div>
              </button>
              
              <div className="flex-1 overflow-y-auto space-y-1">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event, date);
                    }}
                    className="text-xs p-1.5 rounded border cursor-pointer hover:opacity-80"
                    style={{
                      borderColor: event.color || "#9333ea",
                      backgroundColor: event.color ? `${event.color}20` : "#9333ea20",
                    }}
                  >
                    {event.time && (
                      <div className="font-semibold text-gray-700 dark:text-gray-300">
                        {event.time}
                      </div>
                    )}
                    <div className="font-medium" style={{ color: event.color || "#9333ea" }}>
                      {event.title}
                    </div>
                    {event.description && (
                      <div className="text-gray-600 dark:text-gray-400 mt-1 truncate">
                        {event.description}
                      </div>
                    )}
                  </div>
                ))}
                {entry && (
                  <div className="text-xs p-1.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    Journal Entry
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DayView({ currentDate, onDateSelect, onDateDoubleClick, selectedDate, onEventClick }: CalendarViewsProps) {
  const { getEvents, getJournalEntry } = useDiaryStore();
  
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  
  const dateKey = formatDateKey(currentDate);
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
  
  const today = isToday(currentDate);
  const past = isPast(currentDate);
  
  return (
    <div className="flex flex-col h-full" onDoubleClick={() => onDateDoubleClick?.(currentDate)}>
      <div className="mb-4">
        <div className={`text-2xl font-bold ${today ? "text-blue-600 dark:text-blue-400" : past ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"}`}>
          {currentDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Events</h3>
          {events.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-sm">No events scheduled</div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick?.(event, currentDate)}
                  className="p-3 rounded-lg border cursor-pointer hover:opacity-80"
                  style={{
                    borderColor: event.color || "#9333ea",
                    backgroundColor: event.color ? `${event.color}20` : "#9333ea20",
                  }}
                >
                  {event.time && (
                    <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {event.time}
                    </div>
                  )}
                  <div className="font-medium text-lg" style={{ color: event.color || "#9333ea" }}>
                    {event.title}
                  </div>
                  {event.description && (
                    <div className="text-gray-600 dark:text-gray-400 mt-2">
                      {event.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Journal Entry</h3>
          {entry ? (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {entry.content}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-sm">No journal entry for this day</div>
          )}
        </div>
      </div>
    </div>
  );
}

