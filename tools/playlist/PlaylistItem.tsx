"use client";

import { PlaylistItem as PlaylistItemType } from "./usePlaylistStore";
import { usePlaylistStore } from "./usePlaylistStore";

interface PlaylistItemProps {
  item: PlaylistItemType;
  index: number;
  isCurrent: boolean;
  isFinished: boolean;
}

export function PlaylistItem({ item, index, isCurrent, isFinished }: PlaylistItemProps) {
  const {
    draggedIndex,
    hoveredIndex,
    setDraggedIndex,
    setHoveredIndex,
    reorderPlaylist,
    removeFromPlaylist,
    handleDoubleClickSong,
  } = usePlaylistStore();

  const handleDragStart = () => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setHoveredIndex(index);
  };

  const handleDragLeave = () => {
    setHoveredIndex(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setHoveredIndex(null);
      return;
    }

    reorderPlaylist(draggedIndex, index);
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromPlaylist(index);
  };

  const handleDoubleClick = () => {
    handleDoubleClickSong(index);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      onDoubleClick={handleDoubleClick}
      className={`p-3 rounded-lg border cursor-move transition-colors ${
        isCurrent
          ? "bg-blue-600 border-blue-500"
          : isFinished
          ? `opacity-60 ${
              index === hoveredIndex && draggedIndex !== null
                ? "bg-gray-600 border-gray-500"
                : "bg-gray-800 border-gray-700 hover:bg-gray-700"
            }`
          : index === hoveredIndex && draggedIndex !== null
          ? "bg-gray-600 border-gray-500"
          : "bg-gray-800 border-gray-700 hover:bg-gray-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 flex items-start gap-2">
          {isCurrent && (
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium truncate ${
                isCurrent ? "text-white" : isFinished ? "text-gray-400" : "text-gray-200"
              }`}
            >
              {item.title}
            </p>
            <p className={`text-xs mt-1 truncate ${isFinished ? "text-gray-500" : "text-gray-400"}`}>
              {item.url}
            </p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
          aria-label="Delete"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

