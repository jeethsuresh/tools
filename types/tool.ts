import { ReactNode } from "react";

/**
 * Metadata for a tool
 */
export interface ToolMetadata {
  id: string;
  name: string;
  description?: string;
}

/**
 * Props passed to each tool component
 */
export interface ToolProps {
  // Tools have full access to the detail pane
  // They can render whatever they need
}

/**
 * Tool definition
 */
export interface Tool {
  metadata: ToolMetadata;
  component: React.ComponentType<ToolProps>;
}

