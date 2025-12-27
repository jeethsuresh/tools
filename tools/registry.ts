import { Tool } from "@/types/tool";
import PlaceholderTool from "./placeholder/PlaceholderTool";
import Base64Tool from "./base64/Base64Tool";
import CsvJsonTool from "./csvjson/CsvJsonTool";
import TimerStopwatchTool from "./timer/TimerStopwatchTool";
import TimezoneTool from "./timezone/TimezoneTool";

/**
 * Registry of all available tools
 * Each tool operates in isolation and has full access to the detail pane
 */
export const tools: Tool[] = [
  // {
  //   metadata: {
  //     id: "placeholder",
  //     name: "Placeholder Tool",
  //     description: "A simple placeholder tool",
  //   },
  //   component: PlaceholderTool,
  // },
  {
    metadata: {
      id: "base64",
      name: "Base64 Encoder/Decoder",
      description: "Encode and decode text in base64 format",
    },
    component: Base64Tool,
  },
  {
    metadata: {
      id: "csvjson",
      name: "CSV ↔ JSON Converter",
      description: "Convert CSV files to JSON and JSON files to CSV",
    },
    component: CsvJsonTool,
  },
  {
    metadata: {
      id: "timer",
      name: "Timer / Stopwatch",
      description: "Countdown timer and stopwatch with lap functionality",
    },
    component: TimerStopwatchTool,
  },
  {
    metadata: {
      id: "timezone",
      name: "Timezone Calculator",
      description: "Convert times between different timezones",
    },
    component: TimezoneTool,
  },
];

/**
 * Get a tool by its ID
 */
export function getToolById(id: string): Tool | undefined {
  return tools.find((tool) => tool.metadata.id === id);
}

/**
 * Get all tool metadata
 */
export function getAllToolMetadata() {
  return tools.map((tool) => tool.metadata);
}

