"use client";

import { useState } from "react";
import { usePlaylistStore, PlaylistItem } from "./usePlaylistStore";

export function AddSongForm() {
  const {
    youtubeUrl,
    setYoutubeUrl,
    isLoading,
    setIsLoading,
    error,
    setError,
    addToPlaylist,
  } = usePlaylistStore();

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const fetchVideoTitle = async (videoId: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      if (response.ok) {
        const data = await response.json();
        return data.title || `Video ${videoId}`;
      }
    } catch (e) {
      console.error("Error fetching video title:", e);
    }
    return `Video ${videoId}`;
  };

  const handleAddSong = async () => {
    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL");
      return;
    }

    const videoId = extractVideoId(youtubeUrl.trim());
    if (!videoId) {
      setError("Invalid YouTube URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const title = await fetchVideoTitle(videoId);
      // Use a more unique ID with timestamp and random component
      const uniqueId = `${videoId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newItem: PlaylistItem = {
        id: uniqueId,
        videoId,
        title,
        url: youtubeUrl.trim(),
      };

      addToPlaylist(newItem);
      setYoutubeUrl("");
    } catch (err) {
      setError("Failed to add video. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 dark:bg-gray-800 border-t border-gray-700 px-4 py-3 flex-shrink-0 z-10">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddSong();
            }
          }}
          placeholder="Paste YouTube URL here..."
          className="flex-1 px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleAddSong}
          disabled={isLoading || !youtubeUrl.trim()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Adding..." : "Add Song"}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-400">{error}</div>
      )}
    </div>
  );
}

