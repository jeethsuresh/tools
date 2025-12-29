"use client";

import { ToolProps } from "@/types/tool";
import { usePlaylistStore } from "./usePlaylistStore";
import { YouTubePlayer } from "./YouTubePlayer";
import { PlayerControls } from "./PlayerControls";
import { PlaylistSidebar } from "./PlaylistSidebar";
import { AddSongForm } from "./AddSongForm";

export default function PlaylistTool({}: ToolProps) {
  const { playlist, isPlaylistExpanded, setIsPlaylistExpanded } = usePlaylistStore();

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden bg-black">
      {/* Top Controls Bar */}
      <div className="bg-gray-900 dark:bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <PlayerControls />
          </div>
          
          {/* Expand Playlist Button */}
          <button
            onClick={() => setIsPlaylistExpanded(!isPlaylistExpanded)}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors relative"
            aria-label={isPlaylistExpanded ? "Collapse playlist" : "Expand playlist"}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            {playlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {playlist.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
          <YouTubePlayer />
        <PlaylistSidebar />
      </div>

      {/* Bottom Input Bar */}
      <AddSongForm />
    </div>
  );
}
