"use client";

import { useState, useEffect } from "react";
import { useDiaryStore } from "./useDiaryStore";

interface JournalEditorProps {
  date: Date;
  onClose: () => void;
}

export function JournalEditor({ date, onClose }: JournalEditorProps) {
  const { getJournalEntry, saveJournalEntry, deleteJournalEntry } = useDiaryStore();
  
  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  
  const dateKey = formatDateKey(date);
  const existingEntry = getJournalEntry(dateKey);
  
  const [content, setContent] = useState(existingEntry?.content || "");
  
  useEffect(() => {
    if (existingEntry) {
      setContent(existingEntry.content);
    } else {
      setContent("");
    }
  }, [dateKey, existingEntry]);
  
  const handleSave = () => {
    if (content.trim()) {
      saveJournalEntry(dateKey, content);
    } else {
      deleteJournalEntry(dateKey);
    }
    onClose();
  };
  
  const handleDelete = () => {
    if (existingEntry) {
      deleteJournalEntry(dateKey);
    }
    onClose();
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Journal Entry - {date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </h2>
      </div>
      
      <div className="flex-1 flex flex-col mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your journal entry here..."
          className="flex-1 w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Save
        </button>
        {existingEntry && (
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

