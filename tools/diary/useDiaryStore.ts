import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD format
  title: string;
  description?: string;
  time?: string; // HH:mm format (optional)
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface DiaryState {
  // Data
  journalEntries: Record<string, JournalEntry>; // key: date (YYYY-MM-DD)
  events: Record<string, CalendarEvent[]>; // key: date (YYYY-MM-DD)
  
  // UI state
  currentView: "day" | "week" | "month";
  currentDate: Date;
  selectedDate: Date | null;
  editingEntry: JournalEntry | null;
  editingEvent: CalendarEvent | null;
  
  // Actions
  setCurrentView: (view: "day" | "week" | "month") => void;
  setCurrentDate: (date: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  
  // Journal entries
  getJournalEntry: (date: string) => JournalEntry | undefined;
  saveJournalEntry: (date: string, content: string) => void;
  deleteJournalEntry: (date: string) => void;
  setEditingEntry: (entry: JournalEntry | null) => void;
  
  // Events
  getEvents: (date: string) => CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  setEditingEvent: (event: CalendarEvent | null) => void;
  
  // Utility
  wipeAllData: () => void;
}

const STORAGE_KEY = "diary-tool-storage";

export const useDiaryStore = create<DiaryState>()(
  persist(
    (set, get) => ({
      // Initial state
      journalEntries: {},
      events: {},
      currentView: "month",
      currentDate: new Date(),
      selectedDate: null,
      editingEntry: null,
      editingEvent: null,

      // View actions
      setCurrentView: (view) => set({ currentView: view }),
      setCurrentDate: (date) => set({ currentDate: date }),
      setSelectedDate: (date) => set({ selectedDate: date }),

      // Journal entries
      getJournalEntry: (date) => {
        return get().journalEntries[date];
      },
      saveJournalEntry: (date, content) => {
        const now = new Date().toISOString();
        const existing = get().journalEntries[date];
        
        set((state) => ({
          journalEntries: {
            ...state.journalEntries,
            [date]: {
              id: existing?.id || `entry-${date}-${Date.now()}`,
              date,
              content,
              createdAt: existing?.createdAt || now,
              updatedAt: now,
            },
          },
        }));
      },
      deleteJournalEntry: (date) => {
        set((state) => {
          const { [date]: _, ...rest } = state.journalEntries;
          return { journalEntries: rest };
        });
      },
      setEditingEntry: (entry) => set({ editingEntry: entry }),

      // Events
      getEvents: (date) => {
        return get().events[date] || [];
      },
      addEvent: (eventData) => {
        const now = new Date().toISOString();
        const event: CalendarEvent = {
          ...eventData,
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => {
          const dateEvents = state.events[event.date] || [];
          return {
            events: {
              ...state.events,
              [event.date]: [...dateEvents, event],
            },
          };
        });
      },
      updateEvent: (id, updates) => {
        set((state) => {
          const newEvents: Record<string, CalendarEvent[]> = {};
          
          for (const [date, events] of Object.entries(state.events)) {
            newEvents[date] = events.map((event) =>
              event.id === id
                ? { ...event, ...updates, updatedAt: new Date().toISOString() }
                : event
            );
          }
          
          return { events: newEvents };
        });
      },
      deleteEvent: (id) => {
        set((state) => {
          const newEvents: Record<string, CalendarEvent[]> = {};
          
          for (const [date, events] of Object.entries(state.events)) {
            newEvents[date] = events.filter((event) => event.id !== id);
          }
          
          return { events: newEvents };
        });
      },
      setEditingEvent: (event) => set({ editingEvent: event }),

      // Utility
      wipeAllData: () => {
        set({
          journalEntries: {},
          events: {},
          selectedDate: null,
          editingEntry: null,
          editingEvent: null,
        });
        // Also clear localStorage directly
        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY);
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        journalEntries: state.journalEntries,
        events: state.events,
      }),
    }
  )
);

