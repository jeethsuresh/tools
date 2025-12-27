"use client";

import { useState, useEffect, useRef } from "react";
import { ToolProps } from "@/types/tool";

// Common timezones list
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Europe/Moscow",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
  "UTC",
];

interface TimezonePanel {
  time: string; // HH:MM:SS format
  timezone: string;
}

export default function TimezoneTool({}: ToolProps) {
  const [localTime, setLocalTime] = useState(new Date());
  const [localTimezone, setLocalTimezone] = useState<string>("");
  const [leftPanel, setLeftPanel] = useState<TimezonePanel>({
    time: "",
    timezone: "",
  });
  const [rightPanel, setRightPanel] = useState<TimezonePanel>({
    time: "",
    timezone: "",
  });
  const [leftSearch, setLeftSearch] = useState("");
  const [rightSearch, setRightSearch] = useState("");
  const [leftDropdownOpen, setLeftDropdownOpen] = useState(false);
  const [rightDropdownOpen, setRightDropdownOpen] = useState(false);
  const [leftTimeFocused, setLeftTimeFocused] = useState(false);
  const [rightTimeFocused, setRightTimeFocused] = useState(false);
  const leftDropdownRef = useRef<HTMLDivElement>(null);
  const rightDropdownRef = useRef<HTMLDivElement>(null);

  // Get local timezone on mount
  useEffect(() => {
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setLocalTimezone(localTz);
    setLeftPanel({
      time: "",
      timezone: localTz,
    });
    setRightPanel({
      time: "",
      timezone: "UTC",
    });
  }, []);

  // Update local time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        leftDropdownRef.current &&
        !leftDropdownRef.current.contains(event.target as Node)
      ) {
        setLeftDropdownOpen(false);
        setLeftSearch("");
      }
      if (
        rightDropdownRef.current &&
        !rightDropdownRef.current.contains(event.target as Node)
      ) {
        setRightDropdownOpen(false);
        setRightSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format time in a specific timezone
  const formatTimeInTimezone = (date: Date, timezone: string): string => {
    if (!timezone) return "";
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(date);
    } catch {
      return "";
    }
  };

  // Convert time from one timezone to another
  const convertTime = (
    timeStr: string,
    fromTimezone: string,
    toTimezone: string
  ): string => {
    if (!timeStr || !fromTimezone || !toTimezone) return "";

    const parts = timeStr.split(":").map(Number);
    if (parts.length < 2 || parts.some(isNaN)) return "";

    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const seconds = parts[2] || 0;

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
      return "";
    }

    try {
      const now = new Date();
      
      // Get current date in source timezone
      const sourceDateStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: fromTimezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);

      // Get current time in source timezone to calculate offset
      const currentSourceTime = new Intl.DateTimeFormat("en-US", {
        timeZone: fromTimezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);

      const [currentH, currentM, currentS] = currentSourceTime.split(":").map(Number);
      const currentSourceSeconds = currentH * 3600 + currentM * 60 + currentS;
      const desiredSourceSeconds = hours * 3600 + minutes * 60 + seconds;
      
      // Calculate difference in seconds
      let diffSeconds = desiredSourceSeconds - currentSourceSeconds;
      
      // Handle day rollover (if difference is more than 12 hours, assume it's the next/previous day)
      if (diffSeconds < -43200) diffSeconds += 86400;
      if (diffSeconds > 43200) diffSeconds -= 86400;

      // Create new date with the difference applied
      const targetDate = new Date(now.getTime() + diffSeconds * 1000);

      // Format in target timezone
      return formatTimeInTimezone(targetDate, toTimezone);
    } catch {
      return "";
    }
  };

  // Filter timezones based on search
  const filterTimezones = (search: string) => {
    if (!search) return TIMEZONES;
    const lowerSearch = search.toLowerCase();
    return TIMEZONES.filter((tz) => {
      const displayName = getTimezoneDisplayName(tz).toLowerCase();
      return tz.toLowerCase().includes(lowerSearch) || displayName.includes(lowerSearch);
    });
  };

  // Format time input (HH:MM:SS or HH:MM)
  const formatTimeInput = (value: string): string => {
    // Remove non-digit and non-colon characters
    const cleaned = value.replace(/[^\d:]/g, "");
    // Limit to 8 characters (HH:MM:SS)
    return cleaned.slice(0, 8);
  };

  // Handle time input change
  const handleLeftTimeChange = (value: string) => {
    const formatted = formatTimeInput(value);
    const currentLeftTimezone = leftPanel.timezone;
    const currentRightTimezone = rightPanel.timezone;
    
    setLeftPanel((prev) => ({ ...prev, time: formatted }));
    
    if (formatted && currentLeftTimezone && currentRightTimezone) {
      const converted = convertTime(formatted, currentLeftTimezone, currentRightTimezone);
      if (converted) {
        setRightPanel((prev) => ({ ...prev, time: converted }));
      }
    } else if (!formatted) {
      // Clear right panel time if left is cleared
      setRightPanel((prev) => ({ ...prev, time: "" }));
    }
  };

  const handleRightTimeChange = (value: string) => {
    const formatted = formatTimeInput(value);
    const currentRightTimezone = rightPanel.timezone;
    const currentLeftTimezone = leftPanel.timezone;
    
    setRightPanel((prev) => ({ ...prev, time: formatted }));
    
    if (formatted && currentRightTimezone && currentLeftTimezone) {
      const converted = convertTime(formatted, currentRightTimezone, currentLeftTimezone);
      if (converted) {
        setLeftPanel((prev) => ({ ...prev, time: converted }));
      }
    } else if (!formatted) {
      // Clear left panel time if right is cleared
      setLeftPanel((prev) => ({ ...prev, time: "" }));
    }
  };

  // Handle timezone selection
  const handleLeftTimezoneSelect = (timezone: string) => {
    const currentLeftTime = leftPanel.time;
    const currentRightTimezone = rightPanel.timezone;
    
    setLeftPanel((prev) => ({ ...prev, timezone }));
    setLeftDropdownOpen(false);
    setLeftSearch("");
    
    // If there's a time in the left panel, convert it using the new timezone
    if (currentLeftTime && currentRightTimezone) {
      const converted = convertTime(currentLeftTime, timezone, currentRightTimezone);
      if (converted) {
        setRightPanel((prev) => ({ ...prev, time: converted }));
      }
    }
  };

  const handleRightTimezoneSelect = (timezone: string) => {
    const currentRightTime = rightPanel.time;
    const currentLeftTimezone = leftPanel.timezone;
    
    setRightPanel((prev) => ({ ...prev, timezone }));
    setRightDropdownOpen(false);
    setRightSearch("");
    
    // If there's a time in the right panel, convert it using the new timezone
    if (currentRightTime && currentLeftTimezone) {
      const converted = convertTime(currentRightTime, timezone, currentLeftTimezone);
      if (converted) {
        setLeftPanel((prev) => ({ ...prev, time: converted }));
      }
    }
  };

  // Format local time display
  const localTimeString = localTime.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Get timezone display name
  const getTimezoneDisplayName = (tz: string): string => {
    if (!tz) return "";
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "short",
      });
      const parts = formatter.formatToParts(now);
      const tzName = parts.find((p) => p.type === "timeZoneName")?.value || tz;
      return `${tz.replace(/_/g, " ")} (${tzName})`;
    } catch {
      return tz.replace(/_/g, " ");
    }
  };

  // Calculate displayed times
  // Show current time in timezone if no time entered
  const leftDisplayTime = leftPanel.time || 
    (leftPanel.timezone 
      ? formatTimeInTimezone(localTime, leftPanel.timezone) 
      : "");
  const rightDisplayTime = rightPanel.time || 
    (rightPanel.timezone
      ? formatTimeInTimezone(localTime, rightPanel.timezone) 
      : "");

  const filteredLeftTimezones = filterTimezones(leftSearch);
  const filteredRightTimezones = filterTimezones(rightSearch);

  return (
    <div className="flex flex-col h-full min-h-screen p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Timezone Calculator
      </h1>

      {/* Local Time Display */}
      <div className="flex justify-center mb-8">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Local Time
          </div>
          <div className="text-4xl md:text-5xl font-mono font-bold text-blue-600 dark:text-blue-400">
            {localTimeString}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            {getTimezoneDisplayName(localTimezone)}
          </div>
        </div>
      </div>

      {/* Two Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* Left Panel */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time
            </label>
            <input
              type="text"
              value={leftTimeFocused ? leftPanel.time : (leftPanel.time || leftDisplayTime || "")}
              onChange={(e) => handleLeftTimeChange(e.target.value)}
              onFocus={() => {
                setLeftTimeFocused(true);
                if (!leftPanel.time) {
                  setLeftPanel((prev) => ({ ...prev, time: "" }));
                }
              }}
              onBlur={() => setLeftTimeFocused(false)}
              placeholder="HH:MM:SS"
              className="w-full text-2xl font-mono text-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div className="relative" ref={leftDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timezone
            </label>
            <div className="relative">
              <input
                type="text"
                value={leftSearch || (leftPanel.timezone ? getTimezoneDisplayName(leftPanel.timezone) : "")}
                onChange={(e) => {
                  setLeftSearch(e.target.value);
                  setLeftDropdownOpen(true);
                }}
                onFocus={() => {
                  setLeftDropdownOpen(true);
                  // Clear search when focusing to allow fresh typing
                  if (leftPanel.timezone) {
                    setLeftSearch("");
                  }
                }}
                placeholder="Select timezone..."
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              {leftDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredLeftTimezones.length > 0 ? (
                    filteredLeftTimezones.map((tz) => (
                      <button
                        key={tz}
                        onClick={() => handleLeftTimezoneSelect(tz)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {getTimezoneDisplayName(tz)}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                      No timezones found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time
            </label>
            <input
              type="text"
              value={rightTimeFocused ? rightPanel.time : (rightPanel.time || rightDisplayTime || "")}
              onChange={(e) => handleRightTimeChange(e.target.value)}
              onFocus={() => {
                setRightTimeFocused(true);
                if (!rightPanel.time) {
                  setRightPanel((prev) => ({ ...prev, time: "" }));
                }
              }}
              onBlur={() => setRightTimeFocused(false)}
              placeholder="HH:MM:SS"
              className="w-full text-2xl font-mono text-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div className="relative" ref={rightDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timezone
            </label>
            <div className="relative">
              <input
                type="text"
                value={rightSearch || (rightPanel.timezone ? getTimezoneDisplayName(rightPanel.timezone) : "")}
                onChange={(e) => {
                  setRightSearch(e.target.value);
                  setRightDropdownOpen(true);
                }}
                onFocus={() => {
                  setRightDropdownOpen(true);
                  // Clear search when focusing to allow fresh typing
                  if (rightPanel.timezone) {
                    setRightSearch("");
                  }
                }}
                placeholder="Select timezone..."
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              {rightDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredRightTimezones.length > 0 ? (
                    filteredRightTimezones.map((tz) => (
                      <button
                        key={tz}
                        onClick={() => handleRightTimezoneSelect(tz)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        {getTimezoneDisplayName(tz)}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                      No timezones found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

