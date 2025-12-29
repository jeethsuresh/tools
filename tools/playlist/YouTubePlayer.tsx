"use client";

import { useEffect, useRef } from "react";
import { usePlaylistStore } from "./usePlaylistStore";

export function YouTubePlayer() {
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const currentVideoIdRef = useRef<string | null>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const isManuallyUpdatingShuffleRef = useRef<boolean>(false);
  const isSeekingRef = useRef<boolean>(false);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingVideoIdRef = useRef<string | null>(null);
  const checkReadyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    playlist,
    currentIndex,
    isPlaying,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    repeatMode,
    isShuffle,
    shuffleOrder,
    playedSongs,
    addPlayedSong,
    removePlayedSong,
    setShuffleOrder,
    previousIndex,
    setPreviousIndex,
    handleNext,
  } = usePlaylistStore();

  // Refs for callbacks
  const currentIndexRef = useRef<number>(currentIndex);
  const playlistLengthRef = useRef<number>(playlist.length);
  const repeatModeRef = useRef<"none" | "all" | "one">(repeatMode);
  const isShuffleRef = useRef<boolean>(isShuffle);
  const shuffleOrderRef = useRef<number[]>(shuffleOrder);
  const playedSongsRef = useRef<Set<number>>(playedSongs);
  const handleNextRef = useRef<() => void>(handleNext);

  // Update refs when state changes
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    playlistLengthRef.current = playlist.length;
  }, [playlist.length]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  useEffect(() => {
    shuffleOrderRef.current = shuffleOrder;
  }, [shuffleOrder]);

  useEffect(() => {
    playedSongsRef.current = playedSongs;
  }, [playedSongs]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  // Track played songs: mark as played when video ends naturally
  useEffect(() => {
    if (currentIndex >= 0 && previousIndex >= 0 && currentIndex !== previousIndex) {
      const wasManuallyNavigated = !playedSongs.has(previousIndex);
      
      if (!wasManuallyNavigated) {
        addPlayedSong(previousIndex);
      }
    } else if (currentIndex >= 0 && previousIndex < 0) {
      setPreviousIndex(currentIndex);
      return;
    }
    
    if (currentIndex >= 0) {
      setPreviousIndex(currentIndex);
    }
  }, [currentIndex, previousIndex, playlist.length, playedSongs, addPlayedSong, setPreviousIndex]);

  // Generate shuffle order when shuffle is enabled
  useEffect(() => {
    if (isManuallyUpdatingShuffleRef.current) {
      isManuallyUpdatingShuffleRef.current = false;
      return;
    }
    
    if (isShuffle && playlist.length > 0) {
      const unplayedIndices = Array.from({ length: playlist.length }, (_, i) => i)
        .filter(i => !playedSongs.has(i) || i === currentIndex);
      
      if (unplayedIndices.length > 0) {
        const currentInList = unplayedIndices.includes(currentIndex);
        const toShuffle = unplayedIndices.filter(i => i !== currentIndex);
        
        // Fisher-Yates shuffle
        for (let i = toShuffle.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [toShuffle[i], toShuffle[j]] = [toShuffle[j], toShuffle[i]];
        }
        
        const order = currentInList && currentIndex >= 0 
          ? [currentIndex, ...toShuffle]
          : toShuffle;
        setShuffleOrder(order);
      } else {
        setShuffleOrder([]);
      }
    } else {
      setShuffleOrder([]);
    }
  }, [isShuffle, playlist.length, playedSongs, currentIndex, setShuffleOrder]);


  // Initialize YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Store the original callback if it exists
      const originalCallback = window.onYouTubeIframeAPIReady;
      
      window.onYouTubeIframeAPIReady = () => {
        // Call original callback if it exists
        if (originalCallback) {
          originalCallback();
        }
      };
    }
  }, []);

  const startTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      // Don't update time if we're currently seeking
      if (isSeekingRef.current) {
        return;
      }
      
      if (playerRef.current && currentIndex >= 0 && currentIndex < playlist.length) {
        try {
          const currentItem = playlist[currentIndex];
          const videoData = playerRef.current.getVideoData();
          if (videoData && videoData.video_id === currentItem.videoId) {
            const time = playerRef.current.getCurrentTime();
            setCurrentTime(time);
          } else {
            setCurrentTime(0);
          }
        } catch (e) {
          setCurrentTime(0);
        }
      } else {
        setCurrentTime(0);
      }
    }, 10);
  };

  const stopTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Calculate currentItem
  const currentItem = currentIndex >= 0 && currentIndex < playlist.length 
    ? playlist[currentIndex] 
    : null;

  // Ensure container has dimensions when currentItem changes
  useEffect(() => {
    if (currentItem && playerContainerRef.current) {
      const container = playerContainerRef.current;
      const parent = container.parentElement;
      
      if (parent) {
        // Use ResizeObserver or setTimeout to ensure parent is sized
        const ensureSize = () => {
          const parentRect = parent.getBoundingClientRect();
          if (parentRect.width > 0 && parentRect.height > 0) {
            // Calculate size based on 16:9 aspect ratio
            const maxWidth = parentRect.width;
            const maxHeight = parentRect.height;
            let width = Math.min(maxWidth, maxHeight * 16 / 9);
            let height = width * 9 / 16;
            
            if (height > maxHeight) {
              height = maxHeight;
              width = height * 16 / 9;
            }
            
            // Ensure minimum size
            width = Math.max(width, 640);
            height = Math.max(height, 360);
            
            container.style.width = `${Math.floor(width)}px`;
            container.style.height = `${Math.floor(height)}px`;
          }
        };
        
        // Try immediately
        ensureSize();
        
        // Also try after a short delay
        const timeout = setTimeout(ensureSize, 100);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [currentItem]);

  // Stop player when no valid current index
  useEffect(() => {
    if (currentIndex < 0 && playerRef.current) {
      playerRef.current.stopVideo();
      setIsPlaying(false);
      stopTimeTracking();
    }
  }, [currentIndex, setIsPlaying]);

  // Initialize player when we have a video
  useEffect(() => {
    if (playlist.length > 0 && currentIndex >= 0 && currentIndex < playlist.length) {
      const currentItem = playlist[currentIndex];
      const shouldLoadVideo = currentVideoIdRef.current !== currentItem.videoId;
      
      const initializePlayer = (retryCount = 0) => {
        if (!playerContainerRef.current) {
          if (retryCount < 50) {
            setTimeout(() => initializePlayer(retryCount + 1), 100);
          }
          return;
        }
        
        const container = playerContainerRef.current;
        
        // Ensure container has dimensions and is visible (max 50 retries)
        if (retryCount < 50) {
          const rect = container.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(container);
          const isVisible = rect.width > 100 && rect.height > 100 && 
                           computedStyle.display !== 'none' &&
                           computedStyle.visibility !== 'hidden' &&
                           computedStyle.opacity !== '0';
          
          if (!isVisible) {
            // Force container to have dimensions if parent has them
            const parent = container.parentElement;
            if (parent) {
              const parentRect = parent.getBoundingClientRect();
              if (parentRect.width > 0 && parentRect.height > 0) {
                // Calculate size based on 16:9 aspect ratio
                const maxWidth = parentRect.width - 32; // account for padding
                const maxHeight = parentRect.height - 32;
                let width = Math.min(maxWidth, maxHeight * 16 / 9);
                let height = width * 9 / 16;
                
                if (height > maxHeight) {
                  height = maxHeight;
                  width = height * 16 / 9;
                }
                
                container.style.width = `${Math.floor(width)}px`;
                container.style.height = `${Math.floor(height)}px`;
              }
            }
            
            // Wait a bit and retry
            setTimeout(() => initializePlayer(retryCount + 1), 100);
            return;
          }
        }
        
        if (!playerRef.current && window.YT && window.YT.Player) {
          isPlayerReadyRef.current = false;
          
          // Get container dimensions
          const rect = container.getBoundingClientRect();
          const width = Math.max(Math.floor(rect.width) || 640, 640);
          const height = Math.max(Math.floor(rect.height) || 360, 360);
          
          playerRef.current = new window.YT.Player(container, {
            videoId: currentItem.videoId,
            width: width,
            height: height,
            playerVars: {
              autoplay: 0,
              controls: 0,
              modestbranding: 1,
              rel: 0,
            },
            events: {
              onReady: (event: any) => {
                isPlayerReadyRef.current = true;
                try {
                  const duration = event.target.getDuration();
                  setDuration(duration);
                  setCurrentTime(0);
                  setIsPlaying(true);
                  event.target.playVideo();
                } catch (e) {
                  console.error("Error in onReady:", e);
                }
              },
              onStateChange: (event: any) => {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                  startTimeTracking();
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                  stopTimeTracking();
                } else if (event.data === window.YT.PlayerState.ENDED) {
                  setIsPlaying(false);
                  stopTimeTracking();
                  handleNextRef.current();
                } else if (event.data === window.YT.PlayerState.CUED) {
                  // Video is cued and ready - immediately try to play
                  if (pendingVideoIdRef.current && playerRef.current) {
                    try {
                      const videoData = playerRef.current.getVideoData();
                      if (videoData && videoData.video_id === pendingVideoIdRef.current) {
                        // Immediately try to play without waiting for duration
                        playerRef.current.playVideo();
                        setIsPlaying(true);
                        
                        // Update state if we have duration
                        const duration = playerRef.current.getDuration();
                        if (duration > 0 && isFinite(duration)) {
                          isPlayerReadyRef.current = true;
                          setDuration(duration);
                          setCurrentTime(0);
                          startTimeTracking();
                          // Clear the polling interval if it exists
                          if (checkReadyIntervalRef.current) {
                            clearInterval(checkReadyIntervalRef.current);
                            checkReadyIntervalRef.current = null;
                          }
                          pendingVideoIdRef.current = null;
                        }
                      }
                    } catch (e) {
                      // Ignore errors
                    }
                  }
                }
              },
              onError: (event: any) => {
                console.error("YouTube player error:", event.data);
                // Error codes: 2=invalid parameter, 5=HTML5 error, 100=video not found, 101/150=not allowed
              },
            },
          });
          currentVideoIdRef.current = currentItem.videoId;
        } else if (playerRef.current && shouldLoadVideo) {
          isPlayerReadyRef.current = false;
          stopTimeTracking();
          setCurrentTime(0);
          setDuration(0);
          
          // Clear any existing interval
          if (checkReadyIntervalRef.current) {
            clearInterval(checkReadyIntervalRef.current);
            checkReadyIntervalRef.current = null;
          }
          
          // Set pending video ID to track when it's ready
          pendingVideoIdRef.current = currentItem.videoId;
          // Set isPlaying to true when navigating to a new video to ensure auto-play
          setIsPlaying(true);
          
          // Use cueVideoById which is faster than loadVideoById
          playerRef.current.cueVideoById({
            videoId: currentItem.videoId,
            startSeconds: 0,
          });
          
          currentVideoIdRef.current = currentItem.videoId;
          
          // Immediately try to play - don't wait for anything
          try {
            if (playerRef.current) {
              playerRef.current.playVideo();
              setIsPlaying(true);
            }
          } catch (e) {
            // Ignore - will retry in loop
          }
          
          // Ultra-aggressive play loop - call playVideo() continuously without any checks
          // This will queue the play command and YouTube will start as soon as video is ready
          let playAttempts = 0;
          const maxPlayAttempts = 400; // Try for 2 seconds (200 * 10ms)
          
          const aggressivePlayLoop = setInterval(() => {
            if (!playerRef.current || pendingVideoIdRef.current !== currentItem.videoId) {
              clearInterval(aggressivePlayLoop);
              return;
            }
            
            try {
              // Just try to play - no checks, no conditions
              playerRef.current.playVideo();
              setIsPlaying(true);
              
              // Check if actually playing
              const playerState = playerRef.current.getPlayerState();
              if (playerState === window.YT.PlayerState.PLAYING) {
                // Success! Update state
                try {
                  const duration = playerRef.current.getDuration();
                  if (duration > 0 && isFinite(duration)) {
                    isPlayerReadyRef.current = true;
                    setDuration(duration);
                    setCurrentTime(0);
                    startTimeTracking();
                    // Clear other intervals
                    if (checkReadyIntervalRef.current) {
                      clearInterval(checkReadyIntervalRef.current);
                      checkReadyIntervalRef.current = null;
                    }
                    pendingVideoIdRef.current = null;
                    clearInterval(aggressivePlayLoop);
                    return;
                  }
                } catch (e) {
                  // Ignore
                }
              }
              
              playAttempts++;
              if (playAttempts >= maxPlayAttempts) {
                clearInterval(aggressivePlayLoop);
              }
            } catch (e) {
              // Ignore errors, keep trying
              playAttempts++;
              if (playAttempts >= maxPlayAttempts) {
                clearInterval(aggressivePlayLoop);
              }
            }
          }, 5); // Try every 5ms

          // Fallback polling with shorter timeout (1 second instead of 5)
          const checkReady = setInterval(() => {
            if (!playerRef.current) {
              clearInterval(checkReady);
              checkReadyIntervalRef.current = null;
              return;
            }
            
            try {
              const videoData = playerRef.current.getVideoData();
              if (videoData && videoData.video_id === currentItem.videoId) {
                const duration = playerRef.current.getDuration();
                const playerState = playerRef.current.getPlayerState();
                
                // Try to play even if duration isn't ready yet
                if (playerState !== window.YT.PlayerState.PLAYING) {
                  try {
                    playerRef.current.playVideo();
                    setIsPlaying(true);
                  } catch (e) {
                    // Ignore
                  }
                }
                
                // Update state if we have duration
                if (duration > 0 && isFinite(duration)) {
                  setIsPlaying(true);
                  isPlayerReadyRef.current = true;
                  setDuration(duration);
                  setCurrentTime(0);
                  playerRef.current.playVideo();
                  startTimeTracking();
                  clearInterval(checkReady);
                  checkReadyIntervalRef.current = null;
                  pendingVideoIdRef.current = null;
                }
              }
            } catch (e) {
              // Player not ready yet
            }
          }, 10);
          
          checkReadyIntervalRef.current = checkReady;
          
          // Reduced timeout from 5 seconds to 1 second as fallback
          setTimeout(() => {
            if (checkReadyIntervalRef.current === checkReady) {
              clearInterval(checkReady);
              checkReadyIntervalRef.current = null;
              if (playerRef.current && pendingVideoIdRef.current === currentItem.videoId) {
                try {
                  const videoData = playerRef.current.getVideoData();
                  if (videoData && videoData.video_id === currentItem.videoId) {
                    const duration = playerRef.current.getDuration();
                    if (duration > 0 && isFinite(duration)) {
                      isPlayerReadyRef.current = true;
                      setDuration(duration);
                      setCurrentTime(0);
                      setIsPlaying(true);
                      playerRef.current.playVideo();
                      startTimeTracking();
                    }
                  }
                } catch (e) {
                  // Ignore
                }
                pendingVideoIdRef.current = null;
              }
            }
          }, 1000);
        } else if (playerRef.current && !shouldLoadVideo) {
          if (isPlaying) {
            startTimeTracking();
          }
        }
      };

      if (shouldLoadVideo) {
        if (window.YT && window.YT.Player) {
          initializePlayer();
        } else {
          const checkAPI = setInterval(() => {
            if (window.YT && window.YT.Player) {
              clearInterval(checkAPI);
              initializePlayer();
            }
          }, 100);

          return () => clearInterval(checkAPI);
        }
      }
    }

    return () => {
      stopTimeTracking();
      if (checkReadyIntervalRef.current) {
        clearInterval(checkReadyIntervalRef.current);
        checkReadyIntervalRef.current = null;
      }
      pendingVideoIdRef.current = null;
    };
  }, [currentIndex, playlist, isPlaying, setCurrentTime, setDuration, setIsPlaying]);

  // Handle container resize to update player size
  useEffect(() => {
    const handleResize = () => {
      if (playerRef.current && playerContainerRef.current) {
        try {
          const rect = playerContainerRef.current.getBoundingClientRect();
          const width = Math.max(rect.width || 640, 640);
          const height = Math.max(rect.height || 360, 360);
          
          // YouTube player doesn't have a resize method, but we can update the iframe
          const iframe = playerContainerRef.current.querySelector('iframe');
          if (iframe) {
            iframe.style.width = `${width}px`;
            iframe.style.height = `${height}px`;
          }
        } catch (e) {
          // Ignore resize errors
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // Also check on mount
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentIndex]);

  // Expose player ref via window for other components
  // The ref object itself is stable, only .current changes
  useEffect(() => {
    (window as any).playlistPlayerRef = playerRef;
    (window as any).playlistPlayerReadyRef = isPlayerReadyRef;
    (window as any).playlistIsSeekingRef = isSeekingRef;
    (window as any).playlistSeekTimeoutRef = seekTimeoutRef;
    return () => {
      delete (window as any).playlistPlayerRef;
      delete (window as any).playlistPlayerReadyRef;
      delete (window as any).playlistIsSeekingRef;
      delete (window as any).playlistSeekTimeoutRef;
    };
  }, []);

  return (
    <div className="flex-1 relative bg-black transition-all duration-300 overflow-hidden">
      {currentItem ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            ref={playerContainerRef}
            id="youtube-player-container"
            style={{ 
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              aspectRatio: "16/9",
              minWidth: '640px',
              minHeight: '360px'
            }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 text-center p-8">
          <div>
            <p className="text-xl mb-2">No video playing</p>
            <p className="text-sm">Add a YouTube link below to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    playlistPlayerRef?: React.MutableRefObject<any>;
    playlistPlayerReadyRef?: React.MutableRefObject<boolean>;
  }
}

