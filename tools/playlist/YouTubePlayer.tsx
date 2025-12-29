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
                  // Clear pending when actually playing
                  if (pendingVideoIdRef.current) {
                    try {
                      const duration = event.target.getDuration();
                      if (duration > 0 && isFinite(duration)) {
                        isPlayerReadyRef.current = true;
                        setDuration(duration);
                        setCurrentTime(0);
                        pendingVideoIdRef.current = null;
                      }
                    } catch (e) {
                      // Ignore
                    }
                  }
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                  stopTimeTracking();
                } else if (event.data === window.YT.PlayerState.ENDED) {
                  setIsPlaying(false);
                  stopTimeTracking();
                  handleNextRef.current();
                } else if (event.data === window.YT.PlayerState.BUFFERING) {
                  // Video is buffering - try to play immediately, multiple times
                  // No state updates - let onStateChange handle it when actually playing
                  if (pendingVideoIdRef.current && playerRef.current) {
                    try {
                      // Try immediately
                      playerRef.current.playVideo();
                      
                      // Try again in next tick
                      setTimeout(() => {
                        try {
                          if (playerRef.current && pendingVideoIdRef.current) {
                            playerRef.current.playVideo();
                          }
                        } catch (e) {
                          // Ignore
                        }
                      }, 0);
                    } catch (e) {
                      // Ignore
                    }
                  }
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
          // Don't set isPlaying here - let onStateChange handle it when video actually starts
          
          // Use loadVideoById - it's more reliable for autoplay
          playerRef.current.loadVideoById({
            videoId: currentItem.videoId,
            startSeconds: 0,
          });
          
          currentVideoIdRef.current = currentItem.videoId;
          
          // Store the aggressive play loop ref so we can clear it
          const aggressivePlayLoopRef = { current: null as number | null };
          
          // Multiple immediate play attempts - just call playVideo(), no state updates
          // State will be updated by onStateChange when video actually starts
          try {
            if (playerRef.current) {
              playerRef.current.playVideo();
            }
          } catch (e) {
            // Ignore
          }
          
          // Try 2: Next tick
          setTimeout(() => {
            try {
              if (playerRef.current && pendingVideoIdRef.current === currentItem.videoId) {
                playerRef.current.playVideo();
              }
            } catch (e) {
              // Ignore
            }
          }, 0);
          
          // Try 3: After 1ms
          setTimeout(() => {
            try {
              if (playerRef.current && pendingVideoIdRef.current === currentItem.videoId) {
                playerRef.current.playVideo();
              }
            } catch (e) {
              // Ignore
            }
          }, 1);
          
          // Ultra-aggressive play loop using requestAnimationFrame for maximum speed
          let playAttempts = 0;
          const maxPlayAttempts = 1000; // Try for ~16 seconds at 60fps
          let rafId: number | null = null;
          
          const tryPlay = () => {
            if (!playerRef.current) {
              if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
              }
              return;
            }
            
            // Check if we should stop (video changed or already playing)
            if (pendingVideoIdRef.current !== currentItem.videoId) {
              if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
              }
              return;
            }
            
            try {
              const playerState = playerRef.current.getPlayerState();
              
              // If already playing, we're done
              if (playerState === window.YT.PlayerState.PLAYING) {
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
                  }
                } catch (e) {
                  // Ignore
                }
                if (rafId !== null) {
                  cancelAnimationFrame(rafId);
                  rafId = null;
                }
                return;
              }
              
              // Just try to play - no state updates, let onStateChange handle it
              playerRef.current.playVideo();
              
              playAttempts++;
              if (playAttempts < maxPlayAttempts) {
                rafId = requestAnimationFrame(tryPlay);
              }
            } catch (e) {
              // Ignore errors, keep trying
              playAttempts++;
              if (playAttempts < maxPlayAttempts) {
                rafId = requestAnimationFrame(tryPlay);
              }
            }
          };
          
          // Start the aggressive play loop
          rafId = requestAnimationFrame(tryPlay);
          aggressivePlayLoopRef.current = rafId;

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

  // Function to load video immediately (called from store)
  const loadVideoImmediately = (videoId: string) => {
    if (!playerRef.current) return;
    
    // Clear any existing intervals
    if (checkReadyIntervalRef.current) {
      clearInterval(checkReadyIntervalRef.current);
      checkReadyIntervalRef.current = null;
    }
    
    // Set pending video ID
    pendingVideoIdRef.current = videoId;
    currentVideoIdRef.current = videoId;
    
    // Load video immediately
    playerRef.current.loadVideoById({
      videoId: videoId,
      startSeconds: 0,
    });
    
    // Immediately try to play
    try {
      if (playerRef.current) {
        playerRef.current.playVideo();
      }
    } catch (e) {
      // Ignore
    }
    
    // Start aggressive play loop
    let playAttempts = 0;
    const maxPlayAttempts = 1000;
    let rafId: number | null = null;
    
    const tryPlay = () => {
      if (!playerRef.current || pendingVideoIdRef.current !== videoId) {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        return;
      }
      
      try {
        const playerState = playerRef.current.getPlayerState();
        if (playerState === window.YT.PlayerState.PLAYING) {
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
          }
          return;
        }
        playerRef.current.playVideo();
        playAttempts++;
        if (playAttempts < maxPlayAttempts) {
          rafId = requestAnimationFrame(tryPlay);
        }
      } catch (e) {
        playAttempts++;
        if (playAttempts < maxPlayAttempts) {
          rafId = requestAnimationFrame(tryPlay);
        }
      }
    };
    
    rafId = requestAnimationFrame(tryPlay);
  };

  // Expose player ref and load function via window for other components
  useEffect(() => {
    (window as any).playlistPlayerRef = playerRef;
    (window as any).playlistPlayerReadyRef = isPlayerReadyRef;
    (window as any).playlistIsSeekingRef = isSeekingRef;
    (window as any).playlistSeekTimeoutRef = seekTimeoutRef;
    (window as any).playlistLoadVideoImmediately = loadVideoImmediately;
    return () => {
      delete (window as any).playlistPlayerRef;
      delete (window as any).playlistPlayerReadyRef;
      delete (window as any).playlistIsSeekingRef;
      delete (window as any).playlistSeekTimeoutRef;
      delete (window as any).playlistLoadVideoImmediately;
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

