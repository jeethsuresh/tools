"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import DetailPane from "@/components/DetailPane";
import { getAllToolMetadata, getToolById } from "@/tools/registry";

function HomeContent() {
  const searchParams = useSearchParams();
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toolsMetadata = getAllToolMetadata();
  const activeTool = activeToolId ? getToolById(activeToolId) : null;
  const ActiveToolComponent = activeTool?.component;

  // Check for tool query parameter on mount
  useEffect(() => {
    const toolParam = searchParams.get("tool");
    if (toolParam) {
      const tool = getToolById(toolParam);
      if (tool) {
        setActiveToolId(toolParam);
      }
    }
  }, [searchParams]);

  const handleToolSelect = (toolId: string) => {
    setActiveToolId(toolId);
    setIsMobileMenuOpen(false); // Close mobile menu when tool is selected
  };

  return (
    <div className="flex h-screen relative">
      {/* Hamburger Menu Button - Always visible on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-gray-900 dark:text-gray-100"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isMobileMenuOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        tools={toolsMetadata}
        activeToolId={activeToolId}
        onToolSelect={handleToolSelect}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Loading...
          </h1>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
