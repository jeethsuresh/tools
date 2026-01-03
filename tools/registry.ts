import { Tool } from "@/types/tool";
import PlaceholderTool from "./placeholder/PlaceholderTool";
import Base64Tool from "./base64/Base64Tool";
import CsvJsonTool from "./csvjson/CsvJsonTool";
import TimerStopwatchTool from "./timer/TimerStopwatchTool";
import TimezoneTool from "./timezone/TimezoneTool";
import PhotoBoothTool from "./photobooth/PhotoBoothTool";
import PlaylistTool from "./playlist/PlaylistTool";
import IPMaskTool from "./ipmask/IPMaskTool";
import DiaryTool from "./diary/DiaryTool";
import QRCodeTool from "./qrcode/QRCodeTool";

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
  {
    metadata: {
      id: "photobooth",
      name: "Photo Booth",
      description: "Test your webcam and microphone with photo capture",
    },
    component: PhotoBoothTool,
  },
  // {
  //   metadata: {
  //     id: "playlist",
  //     name: "Music Playlist",
  //     description: "Create and play playlists of YouTube music videos",
  //   },
  //   component: PlaylistTool,
  // },
  {
    metadata: {
      id: "ipmask",
      name: "IP Masking Calculator",
      description: "Calculate subnet masks, check network classes, detect conflicts, and generate optimal subnets",
    },
    component: IPMaskTool,
  },
  {
    metadata: {
      id: "diary",
      name: "Diary & Calendar",
      description: "Journal entries and event planning with calendar views (day/week/month)",
    },
    component: DiaryTool,
  },
  {
    metadata: {
      id: "qrcode",
      name: "QR Code Generator & Scanner",
      description: "Generate QR codes from text or scan QR codes with your camera",
    },
    component: QRCodeTool,
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

