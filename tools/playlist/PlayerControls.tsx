"use client";

import { usePlaylistStore } from "./usePlaylistStore";

export function PlayerControls() {
  const {
    isPlaying,
    setIsPlaying,
    handleNext,
    handlePrevious,
    currentTime,
    duration,
    playlist,
    currentIndex,
  } = usePlaylistStore();

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    const playerRef = (window as any).playlistPlayerRef;
    const isReadyRef = (window as any).playlistPlayerReadyRef;
    
    if (playerRef?.current && isReadyRef?.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const playerRef = (window as any).playlistPlayerRef;
    const isReadyRef = (window as any).playlistPlayerReadyRef;
    const isSeekingRef = (window as any).playlistIsSeekingRef;
    const seekTimeoutRef = (window as any).playlistSeekTimeoutRef;
    
    if (!playerRef?.current || !isReadyRef?.current || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percent * duration;
    
    try {
      isSeekingRef.current = true;
      playerRef.current.seekTo(newTime, true);
      
      if (seekTimeoutRef?.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      
      seekTimeoutRef.current = setTimeout(() => {
        isSeekingRef.current = false;
      }, 500);
    } catch (e) {
      isSeekingRef.current = false;
    }
  };

  const hasPlaylist = playlist.length > 0;
  const hasCurrent = currentIndex >= 0 && currentIndex < playlist.length;

  return (
    <div className="flex items-center gap-4 flex-1">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={!hasPlaylist || !hasCurrent}
        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous song"
      >
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
        </svg>
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        disabled={!hasCurrent}
        className="p-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={!hasPlaylist || !hasCurrent}
        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next song"
      >
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
        </svg>
      </button>

      {/* Time Display and Progress Bar */}
      {hasCurrent && duration > 0 && (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-sm text-gray-300 whitespace-nowrap">
            {formatTime(currentTime)}
          </span>
          <div
            onClick={handleSeek}
            className="flex-1 h-2 bg-gray-700 rounded-full cursor-pointer hover:h-3 transition-all relative group"
          >
            <div
              className="absolute left-0 top-0 h-full bg-purple-600 rounded-full transition-all"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${(currentTime / duration) * 100}%`, transform: "translate(-50%, -50%)" }}
            />
          </div>
          <span className="text-sm text-gray-300 whitespace-nowrap">
            {formatTime(duration)}
          </span>
        </div>
      )}
    </div>
  );
}

