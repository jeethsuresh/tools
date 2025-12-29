"use client";

import { useState } from "react";
import { ToolProps } from "@/types/tool";

// Base64URL decode (for JWT tokens)
function base64UrlDecode(str: string): string {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  while (base64.length % 4) {
    base64 += "=";
  }
  try {
    return atob(base64);
  } catch {
    // If base64url decode fails, try regular base64
    return atob(str);
  }
}

// Base64URL encode (for JWT tokens)
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  // Convert base64 to base64url
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Regular base64 decode with fallback
function decodeBase64(str: string): string {
  try {
    return atob(str);
  } catch {
    // Try base64url if regular base64 fails
    return base64UrlDecode(str);
  }
}

// Check if string is valid JSON
function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// Format JSON with indentation
function formatJSON(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

export default function Base64Tool({}: ToolProps) {
  const [decodedText, setDecodedText] = useState("");
  const [encodedText, setEncodedText] = useState("");

  const handleEncode = () => {
    try {
      const lines = decodedText.split("\n").filter((line) => line.trim().length > 0);
      
      // If multiple lines detected, treat as JWT token parts
      if (lines.length > 1) {
        const encodedParts: string[] = [];
        for (const line of lines) {
          // Try to parse as JSON first
          if (isValidJSON(line.trim())) {
            encodedParts.push(base64UrlEncode(line.trim()));
          } else {
            // If not JSON, encode as regular text
            encodedParts.push(base64UrlEncode(line));
          }
        }
        setEncodedText(encodedParts.join("."));
      } else {
        // Single line - encode normally
        const encoded = btoa(decodedText);
        setEncodedText(encoded);
      }
    } catch (error) {
      alert("Error encoding text: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleDecode = () => {
    try {
      // Check if encoded text contains . separators (JWT token format)
      if (encodedText.includes(".")) {
        const parts = encodedText.split(".");
        const decodedParts: string[] = [];
        
        for (const part of parts) {
          if (part.trim().length === 0) continue;
          
          try {
            const decoded = decodeBase64(part.trim());
            // Try to parse as JSON and format it
            if (isValidJSON(decoded)) {
              decodedParts.push(formatJSON(decoded));
            } else {
              decodedParts.push(decoded);
            }
          } catch (err) {
            // If decoding fails for a part, include it as-is
            decodedParts.push(`[Error decoding: ${part}]`);
          }
        }
        
        setDecodedText(decodedParts.join("\n"));
      } else {
        // No . separators - decode normally
        const decoded = decodeBase64(encodedText);
        // Try to format as JSON if valid
        if (isValidJSON(decoded)) {
          setDecodedText(formatJSON(decoded));
        } else {
          setDecodedText(decoded);
        }
      }
    } catch (error) {
      alert("Error decoding text: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleReset = () => {
    setDecodedText("");
    setEncodedText("");
  };

  return (
    <div className="flex flex-col h-full min-h-screen p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Base64 Encoder/Decoder
      </h1>
      <div className="flex gap-4 flex-1">
        {/* Decoded text column */}
        <div className="flex-1 flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Decoded text
          </label>
          <textarea
            value={decodedText}
            onChange={(e) => setDecodedText(e.target.value)}
            className="flex-1 w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Enter text to encode..."
          />
        </div>

        {/* Buttons column */}
        <div className="flex flex-col justify-center gap-3">
          <button
            onClick={handleEncode}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Encode
          </button>
          <button
            onClick={handleDecode}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Decode
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Reset
          </button>
        </div>

        {/* Encoded text column */}
        <div className="flex-1 flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Encoded text
          </label>
          <textarea
            value={encodedText}
            onChange={(e) => setEncodedText(e.target.value)}
            className="flex-1 w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Enter base64 text to decode..."
          />
        </div>
      </div>
    </div>
  );
}

