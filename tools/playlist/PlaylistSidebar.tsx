"use client";

import { usePlaylistStore } from "./usePlaylistStore";
import { PlaylistItem } from "./PlaylistItem";

export function PlaylistSidebar() {
  const {
    playlist,
    currentIndex,
    isPlaylistExpanded,
    setIsPlaylistExpanded,
    isShuffle,
    shuffleOrder,
    playedSongs,
    repeatMode,
    setRepeatMode,
    setIsShuffle,
  } = usePlaylistStore();

  if (!isPlaylistExpanded) return null;

  // Get finished songs (excluding current)
  const finishedIndices = Array.from(playedSongs)
    .filter(i => i !== currentIndex)
    .sort((a, b) => a - b);
  
  // Get upcoming songs in order (current first, then rest in shuffle/normal order)
  let upcomingIndices: number[];
  if (isShuffle && shuffleOrder.length > 0) {
    upcomingIndices = shuffleOrder;
  } else {
    const unplayed = Array.from({ length: playlist.length }, (_, i) => i)
      .filter(i => !playedSongs.has(i) || i === currentIndex);
    if (currentIndex >= 0 && unplayed.includes(currentIndex)) {
      upcomingIndices = [currentIndex, ...unplayed.filter(i => i !== currentIndex)];
    } else {
      upcomingIndices = unplayed;
    }
  }

  const handleRepeatToggle = () => {
    const modes: ("none" | "all" | "one")[] = ["none", "all", "one"];
    const currentModeIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentModeIndex + 1) % modes.length]);
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-gray-900 dark:bg-gray-800 border-l border-gray-700 overflow-y-auto z-20">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Playlist ({playlist.length})
          </h2>
          <button
            onClick={() => setIsPlaylistExpanded(false)}
            className="px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            aria-label="Close playlist"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Repeat and Shuffle Buttons */}
        {playlist.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={handleRepeatToggle}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                repeatMode === "none"
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : repeatMode === "all"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
              aria-label={`Repeat: ${repeatMode}`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">
                {repeatMode === "none" ? "No Repeat" : repeatMode === "all" ? "Repeat All" : "Repeat One"}
              </span>
              {repeatMode === "one" && (
                <span className="text-xs">1</span>
              )}
            </button>
            
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isShuffle
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300"
              }`}
              aria-label={isShuffle ? "Shuffle on" : "Shuffle off"}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.5 2a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V3a1 1 0 00-1-1h-1zM11 2a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1V3a1 1 0 00-1-1h-1zM5 7a1 1 0 000 2h1a1 1 0 100-2H5zM14 7a1 1 0 100 2h1a1 1 0 100-2h-1zM5.93 10.914l3.293-3.293a1 1 0 011.414 0l3.293 3.293a1 1 0 01-1.414 1.414L11 10.414V13a1 1 0 11-2 0v-2.586l-1.293 1.293a1 1 0 01-1.414-1.414z" />
              </svg>
              <span className="text-xs font-medium">Shuffle</span>
            </button>
          </div>
        )}
        
        {playlist.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8">
            <p>Playlist is empty</p>
            <p className="text-sm mt-2">Add songs using the input below</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Finished songs at the top */}
            {finishedIndices.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2 px-2">
                  Finished ({finishedIndices.length})
                </div>
                <div className="space-y-2">
                  {finishedIndices.map((index) => (
                    <PlaylistItem
                      key={playlist[index].id}
                      item={playlist[index]}
                      index={index}
                      isCurrent={index === currentIndex}
                      isFinished={true}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Upcoming songs (current at top, then rest) */}
            {upcomingIndices.length > 0 && (
              <div>
                {finishedIndices.length > 0 && (
                  <div className="text-xs text-gray-500 mb-2 px-2">
                    Upcoming ({upcomingIndices.length})
                  </div>
                )}
                <div className="space-y-2">
                  {upcomingIndices.map((index) => (
                    <PlaylistItem
                      key={playlist[index].id}
                      item={playlist[index]}
                      index={index}
                      isCurrent={index === currentIndex}
                      isFinished={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

