"use client";

import { ToolMetadata } from "@/types/tool";

interface SidebarProps {
  tools: ToolMetadata[];
  activeToolId: string | null;
  onToolSelect: (toolId: string) => void;
}

export default function Sidebar({
  tools,
  activeToolId,
  onToolSelect,
}: SidebarProps) {
  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-screen overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Tools
        </h2>
        <nav className="space-y-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                activeToolId === tool.id
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="font-medium">{tool.name}</div>
              {tool.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {tool.description}
                </div>
              )}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

