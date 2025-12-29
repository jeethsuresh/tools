"use client";

import { useState } from "react";
import { ToolProps } from "@/types/tool";
import { useDiaryStore } from "./useDiaryStore";
import { MonthView, WeekView, DayView } from "./CalendarViews";
import { JournalEditor } from "./JournalEditor";
import { EventEditor } from "./EventEditor";
import { DateDetailPanel } from "./DateDetailPanel";
import { CalendarEvent } from "./useDiaryStore";

export default function DiaryTool({}: ToolProps) {
  const {
    currentView,
    currentDate,
    selectedDate,
    setCurrentView,
    setCurrentDate,
    setSelectedDate,
    getEvents,
    wipeAllData,
  } = useDiaryStore();
  
  const [showJournalEditor, setShowJournalEditor] = useState(false);
  const [showEventEditor, setShowEventEditor] = useState(false);
  const [showDateDetail, setShowDateDetail] = useState(false);
  const [detailDate, setDetailDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // If the detail panel is open, update it to show the clicked date
    if (showDateDetail) {
      setDetailDate(date);
    }
  };
  
  const handleDateDoubleClick = (date: Date) => {
    setDetailDate(date);
    setSelectedDate(date);
    setShowDateDetail(true);
  };
  
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (currentView === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };
  
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (currentView === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };
  
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    // If the detail panel is open, update it to show today
    if (showDateDetail) {
      setDetailDate(today);
    }
  };
  
  const handleEditEvent = (event: CalendarEvent, date?: Date) => {
    // Use the event's date, or the provided date, or current date
    const eventDate = event.date ? new Date(event.date + "T00:00:00") : (date || currentDate);
    setSelectedDate(eventDate);
    setCurrentDate(eventDate);
    // Open the detail panel and set the event to edit
    setDetailDate(eventDate);
    setEditingEvent(event);
    setShowDateDetail(true);
  };
  
  const handleWipeData = () => {
    if (confirm("Are you sure you want to wipe all diary data? This cannot be undone.")) {
      wipeAllData();
      setSelectedDate(null);
      setShowJournalEditor(false);
      setShowEventEditor(false);
      setEditingEvent(null);
    }
  };
  
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  
  const getViewTitle = () => {
    if (currentView === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (currentView === "week") {
      const startOfWeek = new Date(currentDate);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
  };
  
  const activeDate = selectedDate || currentDate;
  
  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Previous"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Next"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-2">
              {getViewTitle()}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setCurrentView("day")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  currentView === "day"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setCurrentView("week")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  currentView === "week"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setCurrentView("month")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  currentView === "month"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                Month
              </button>
            </div>
            
            {/* Action Buttons */}
            <button
              onClick={handleWipeData}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              title="Wipe all data (for testing)"
            >
              Wipe Data
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {/* Calendar View */}
        <div className={`overflow-y-auto transition-all duration-300 ${showDateDetail || showJournalEditor || showEventEditor ? "h-1/2" : "h-full"}`}>
          <div className="p-4">
            {currentView === "month" && (
              <MonthView
                currentDate={currentDate}
                onDateSelect={handleDateSelect}
                onDateDoubleClick={handleDateDoubleClick}
                selectedDate={selectedDate}
                onEventClick={handleEditEvent}
              />
            )}
            {currentView === "week" && (
              <WeekView
                currentDate={currentDate}
                onDateSelect={handleDateSelect}
                onDateDoubleClick={handleDateDoubleClick}
                selectedDate={selectedDate}
                onEventClick={handleEditEvent}
              />
            )}
            {currentView === "day" && (
              <DayView
                currentDate={currentDate}
                onDateSelect={handleDateSelect}
                onDateDoubleClick={handleDateDoubleClick}
                selectedDate={selectedDate}
                onEventClick={handleEditEvent}
              />
            )}
          </div>
        </div>

        {/* Sliding Panel for Date Detail */}
        {showDateDetail && detailDate && (
          <div className="h-1/2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto transition-all duration-300 ease-in-out">
            <div className="p-4">
              <DateDetailPanel
                date={detailDate}
                initialEvent={editingEvent}
                onClose={() => {
                  setShowDateDetail(false);
                  setDetailDate(null);
                  setEditingEvent(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Sliding Panel for Journal Editor */}
        {showJournalEditor && !showDateDetail && (
          <div className="h-1/2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto transition-all duration-300 ease-in-out">
            <div className="p-4">
              <JournalEditor
                date={activeDate}
                onClose={() => {
                  setShowJournalEditor(false);
                  setSelectedDate(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Sliding Panel for Event Editor */}
        {showEventEditor && !showDateDetail && (
          <div className="h-1/2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto transition-all duration-300 ease-in-out">
            <div className="p-4">
              <EventEditor
                date={editingEvent ? new Date(editingEvent.date + "T00:00:00") : activeDate}
                event={editingEvent}
                onClose={() => {
                  setShowEventEditor(false);
                  setEditingEvent(null);
                  setSelectedDate(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}

