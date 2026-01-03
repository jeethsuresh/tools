"use client";

import { useState } from "react";
import { ToolProps } from "@/types/tool";

export default function Base64Tool({}: ToolProps) {
  const [decodedText, setDecodedText] = useState("");
  const [encodedText, setEncodedText] = useState("");

  const handleEncode = () => {
    try {
      const encoded = btoa(decodedText);
      setEncodedText(encoded);
    } catch (error) {
      alert("Error encoding text: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleDecode = () => {
    try {
      const decoded = atob(encodedText);
      setDecodedText(decoded);
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

