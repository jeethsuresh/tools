"use client";

import { useState, useEffect, useRef } from "react";
import { ToolProps } from "@/types/tool";

export default function PhotoBoothTool({}: ToolProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  // Audio level monitoring
  useEffect(() => {
    if (!isStreaming || !streamRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setAudioLevel(0);
      return;
    }

    try {
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length === 0) {
        setAudioLevel(0);
        return;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
        source.connect(analyserRef.current);
      }

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 255) * 100));

        if (isStreaming) {
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };

      updateAudioLevel();
    } catch (err) {
      console.error("Error setting up audio monitoring:", err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isStreaming]);

  const startStream = async () => {
    try {
      setError(null);
      
      // Stop existing stream if any
      stopStream();

      // Wait a bit for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        
        // Wait for video to be ready before playing
        await new Promise<void>((resolve, reject) => {
          const onLoadedMetadata = () => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };
          
          const onError = (e: Event) => {
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video failed to load'));
          };
          
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);
          
          // If already loaded, resolve immediately
          if (video.readyState >= 1) {
            onLoadedMetadata();
          }
        });

        try {
          await video.play();
          setIsStreaming(true);
        } catch (playError) {
          console.error('Video play error:', playError);
          setError('Video failed to play. Please try again.');
          stopStream();
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera/microphone";
      setError(errorMessage);
      setIsStreaming(false);
      console.error('Stream error:', err);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setIsStreaming(false);
    setAudioLevel(0);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const photoData = canvas.toDataURL("image/png");
      setCapturedPhotos((prev) => [photoData, ...prev]);
    }
  };

  const toggleCamera = async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    
    if (isStreaming) {
      stopStream();
      // Small delay to ensure cleanup
      setTimeout(() => {
        startStream();
      }, 100);
    }
  };

  const clearPhotos = () => {
    setCapturedPhotos([]);
  };

  const downloadPhoto = (photoData: string, index: number) => {
    const link = document.createElement("a");
    link.download = `photobooth-${Date.now()}-${index}.png`;
    link.href = photoData;
    link.click();
  };

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden bg-black">
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg max-w-md">
          <p className="text-red-800 dark:text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Camera Preview - Takes up most of the screen */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain ${isStreaming ? 'block' : 'hidden'}`}
        />
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 text-center p-8">
            <div>
              <p className="text-xl mb-2">Camera Off</p>
              <p className="text-sm">Click "Start Camera" to begin</p>
            </div>
          </div>
        )}

        {/* Audio Level Indicator - Overlay on video */}
        {isStreaming && (
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 min-w-[200px]">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-white whitespace-nowrap">
                Mic:
              </label>
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <span className="text-xs text-white w-10 text-right">
                {Math.round(audioLevel)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="bg-gray-900 dark:bg-gray-800 border-t border-gray-700 px-4 py-3 flex items-center justify-center gap-3 flex-shrink-0">
        <button
          onClick={isStreaming ? stopStream : startStream}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            isStreaming
              ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
              : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500"
          }`}
        >
          {isStreaming ? "Stop" : "Start"}
        </button>

        <button
          onClick={capturePhoto}
          disabled={!isStreaming}
          className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Capture
        </button>

        <button
          onClick={toggleCamera}
          disabled={!isStreaming}
          className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {facingMode === "user" ? "Front" : "Back"}
        </button>

        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 relative ${
            capturedPhotos.length > 0
              ? "bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500"
              : "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500"
          }`}
        >
          Photos
          {capturedPhotos.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {capturedPhotos.length}
            </span>
          )}
        </button>

        {capturedPhotos.length > 0 && (
          <button
            onClick={clearPhotos}
            className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Clear
          </button>
        )}
      </div>

      {/* Bottom Drawer for Photos */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 shadow-2xl transition-transform duration-300 ease-out z-50 ${
          drawerOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "60vh" }}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Captured Photos ({capturedPhotos.length})
            </h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {capturedPhotos.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 py-12">
                <p>No photos captured yet</p>
                <p className="text-sm mt-2">Click "Capture" to take a picture</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {capturedPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2 bg-white dark:bg-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Photo {index + 1}
                      </p>
                      <button
                        onClick={() => downloadPhoto(photo, index)}
                        className="w-full px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for capturing photos */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

