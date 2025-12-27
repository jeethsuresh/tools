"use client";

import { useState, useEffect, useRef } from "react";
import { ToolProps } from "@/types/tool";

interface Lap {
  lapNumber: number;
  lapTime: number; // in seconds
  totalTime: number; // in seconds
}

export default function TimerStopwatchTool({}: ToolProps) {
  const [inputTime, setInputTime] = useState("00:00:00");
  const [displayTime, setDisplayTime] = useState(0); // in seconds
  const [mode, setMode] = useState<"idle" | "timer" | "paused" | "stopwatch">("idle");
  const [laps, setLaps] = useState<Lap[]>([]);
  const [targetLapTime, setTargetLapTime] = useState(0); // in seconds
  const [lastLapTime, setLastLapTime] = useState(0); // in seconds, for calculating lap intervals
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Smart parse time string to seconds
  // "12" = 12 seconds
  // "12:00" = 12 minutes
  // "12:00:00" = 12 hours
  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr || timeStr.trim() === "") return 0;
    
    const parts = timeStr.split(":").filter(Boolean);
    if (parts.length === 0) return 0;
    
    // Check if all parts are valid numbers
    const numParts = parts.map(Number);
    if (numParts.some(isNaN)) return 0;
    
    // Smart parsing based on number of parts
    if (parts.length === 1) {
      // Single number = seconds
      return numParts[0];
    } else if (parts.length === 2) {
      // Two numbers = MM:SS
      return numParts[0] * 60 + numParts[1];
    } else if (parts.length === 3) {
      // Three numbers = HH:MM:SS
      return numParts[0] * 3600 + numParts[1] * 60 + numParts[2];
    }
    
    return 0;
  };

  // Format seconds to time string (HH:MM:SS)
  const formatSecondsToTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Format seconds to readable time (for lap display)
  const formatLapTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer/Stopwatch logic
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (mode === "timer") {
      intervalRef.current = setInterval(() => {
        setDisplayTime((prev) => {
          if (prev <= 1) {
            setMode("idle");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (mode === "stopwatch") {
      intervalRef.current = setInterval(() => {
        setDisplayTime((prev) => prev + 1);
      }, 1000);
    }
    // "paused" mode doesn't run interval

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits and colons, format as HH:MM:SS
    const cleaned = value.replace(/[^\d:]/g, "");
    if (cleaned.length <= 8) {
      setInputTime(cleaned);
    }
  };

  const handleInputFocus = () => {
    // Clear the input if it's the default placeholder value
    if (inputTime === "00:00:00") {
      setInputTime("");
    }
  };

  const handleInputBlur = () => {
    // If empty, set back to default
    if (inputTime === "" || inputTime.trim() === "") {
      setInputTime("00:00:00");
      return;
    }
    // Parse and format the input using smart parsing
    const seconds = parseTimeToSeconds(inputTime);
    setInputTime(formatSecondsToTime(seconds));
  };

  const handleTimerClick = () => {
    if (mode === "timer") {
      // Pause timer
      setMode("paused");
    } else if (mode === "paused") {
      // Resume timer
      setMode("timer");
    } else {
      // Start timer
      const seconds = parseTimeToSeconds(inputTime);
      if (seconds > 0) {
        setDisplayTime(seconds);
        setMode("timer");
      }
    }
  };

  const handleReset = () => {
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // Reset all state
    setMode("idle");
    setDisplayTime(0);
    setInputTime("00:00:00");
    setLaps([]);
    setTargetLapTime(0);
    setLastLapTime(0);
  };

  const handleStopwatchClick = () => {
    if (mode === "stopwatch") {
      // Stop stopwatch
      setMode("idle");
      setDisplayTime(parseTimeToSeconds(inputTime));
    } else {
      // Start stopwatch
      const seconds = parseTimeToSeconds(inputTime);
      setTargetLapTime(seconds);
      setDisplayTime(0);
      setLastLapTime(0);
      setLaps([]); // Clear laps when starting new stopwatch
      setMode("stopwatch");
    }
  };

  const handleLapClick = () => {
    if (mode === "stopwatch") {
      const currentTotal = displayTime;
      const lapTime = currentTotal - lastLapTime;
      setLaps((prev) => [
        ...prev,
        {
          lapNumber: prev.length + 1,
          lapTime,
          totalTime: currentTotal,
        },
      ]);
      setLastLapTime(currentTotal);
    }
  };

  const handleEndClick = () => {
    if (mode === "stopwatch") {
      setMode("idle");
      setDisplayTime(parseTimeToSeconds(inputTime));
      // Don't clear laps - they persist until next stopwatch start
    }
  };

  const displayTimeString = formatSecondsToTime(displayTime);

  return (
    <div className="flex flex-col h-full min-h-screen p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Timer / Stopwatch
      </h1>

      <div className="flex flex-col items-center gap-6">
        {/* Large Digital Clock Display */}
        {mode !== "stopwatch" && (
          <div className="w-full max-w-2xl">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time (HH:MM:SS)
            </label>
            <input
              type="text"
              value={inputTime}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              disabled={mode !== "idle" && mode !== "paused"}
              className="w-full text-6xl md:text-8xl font-mono text-center p-6 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="00:00:00"
            />
          </div>
        )}

        {/* Display Time (for timer/stopwatch/paused) */}
        {(mode === "timer" || mode === "paused" || mode === "stopwatch") && (
          <div className="w-full max-w-2xl">
            <div className={`text-6xl md:text-8xl font-mono text-center p-6 border-2 rounded-lg ${
              mode === "paused"
                ? "border-yellow-500 dark:border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300"
                : "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
            }`}>
              {displayTimeString}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleTimerClick}
            disabled={mode === "stopwatch"}
            className={`px-8 py-4 text-lg font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              mode === "timer"
                ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                : mode === "paused"
                ? "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500"
                : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {mode === "timer" ? "Pause Timer" : mode === "paused" ? "Resume Timer" : "Timer"}
          </button>
          <button
            onClick={handleStopwatchClick}
            disabled={mode === "timer" || mode === "paused"}
            className={`px-8 py-4 text-lg font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
              mode === "stopwatch"
                ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
                : "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {mode === "stopwatch" ? "Stop Stopwatch" : "Stopwatch"}
          </button>
          <button
            onClick={handleReset}
            className="px-8 py-4 text-lg font-medium rounded-lg transition-colors bg-gray-600 hover:bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Reset
          </button>
        </div>

        {/* Stopwatch Controls */}
        {mode === "stopwatch" && (
          <div className="flex gap-4">
            <button
              onClick={handleLapClick}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Lap
            </button>
            <button
              onClick={handleEndClick}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              End
            </button>
          </div>
        )}

        {/* Lap Table */}
        {(laps.length > 0 || mode === "stopwatch") && (
          <div className="w-full max-w-4xl mt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Laps
            </h2>
            {laps.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                        Lap
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                        Lap Time
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-gray-100">
                        Total Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {laps.map((lap) => (
                      <tr
                        key={lap.lapNumber}
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                          {lap.lapNumber}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">
                          {formatLapTime(lap.lapTime)}
                        </td>
                        <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">
                          {formatLapTime(lap.totalTime)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Click "Lap" to record lap times
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

