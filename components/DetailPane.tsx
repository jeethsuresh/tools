"use client";

import { ReactNode } from "react";

interface DetailPaneProps {
  children: ReactNode;
}

export default function DetailPane({ children }: DetailPaneProps) {
  return (
    <div className="flex-1 h-screen overflow-y-auto bg-gray-50 dark:bg-gray-950">
      {children}
    </div>
  );
}

