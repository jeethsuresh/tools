"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DetailPane from "@/components/DetailPane";
import { getAllToolMetadata, getToolById } from "@/tools/registry";

export default function Home() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const toolsMetadata = getAllToolMetadata();
  const activeTool = activeToolId ? getToolById(activeToolId) : null;
  const ActiveToolComponent = activeTool?.component;

  return (
    <div className="flex h-screen">
      <Sidebar
        tools={toolsMetadata}
        activeToolId={activeToolId}
        onToolSelect={setActiveToolId}
      />
      <DetailPane>
        {ActiveToolComponent ? (
          <ActiveToolComponent />
        ) : (
          <div className="flex items-center justify-center h-full min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Select a tool
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a tool from the sidebar to get started.
              </p>
            </div>
          </div>
        )}
      </DetailPane>
    </div>
  );
}
