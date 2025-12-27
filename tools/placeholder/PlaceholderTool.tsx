"use client";

import { ToolProps } from "@/types/tool";

export default function PlaceholderTool({}: ToolProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Placeholder Tool
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          This is a placeholder tool. It will be replaced with actual tools later.
        </p>
      </div>
    </div>
  );
}

