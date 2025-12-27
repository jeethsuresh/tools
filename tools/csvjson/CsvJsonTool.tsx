"use client";

import { useState } from "react";
import { ToolProps } from "@/types/tool";

type FileFormat = "csv" | "json" | null;

export default function CsvJsonTool({}: ToolProps) {
  const [fileFormat, setFileFormat] = useState<FileFormat>(null);
  const [convertedContent, setConvertedContent] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  /**
   * Escape a CSV field value
   * Handles commas, quotes, and newlines
   */
  const escapeCsvField = (value: string): string => {
    // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  /**
   * Parse a CSV line into an array of field values
   * Properly handles quoted fields, escaped quotes, and commas within quotes
   * Throws error if CSV is malformed (e.g., unclosed quotes)
   */
  const parseCsvLine = (line: string, lineNumber?: number): string[] => {
    const values: string[] = [];
    let currentValue = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote (double quote)
          currentValue += '"';
          j++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // End of field
        values.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }

    // Check for unclosed quotes - this indicates malformed CSV
    if (inQuotes) {
      const lineInfo = lineNumber !== undefined ? ` on line ${lineNumber}` : "";
      throw new Error(`Invalid CSV: Unclosed quote${lineInfo}`);
    }

    // Add last value
    values.push(currentValue.trim());

    return values;
  };

  /**
   * Parse CSV content and convert to JSON
   * Note: Validation should be done before calling this function
   */
  const csvToJson = (csvContent: string): string => {
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim() !== "");
    
    // First line is headers - parse it the same way as data rows
    const headers = parseCsvLine(lines[0]);
    const result: Record<string, string>[] = [];

    // Parse each data row
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);

      // Create object from headers and values
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || "";
      });
      result.push(obj);
    }

    return JSON.stringify(result, null, 2);
  };

  /**
   * Parse JSON content and convert to CSV
   * Note: Validation should be done before calling this function
   */
  const jsonToCsv = (jsonContent: string): string => {
    const data = JSON.parse(jsonContent) as Record<string, any>[];

    // First pass: collect all unique keys across all objects
    const allKeys = new Set<string>();
    data.forEach((obj) => {
      Object.keys(obj).forEach((key) => allKeys.add(key));
    });

    const headers = Array.from(allKeys);

    // Second pass: create CSV rows
    const csvLines: string[] = [];
    
    // Header row
    csvLines.push(headers.map(escapeCsvField).join(","));

    // Data rows
    data.forEach((obj) => {
      const row = headers.map((header) => {
        const value = obj[header];
        // Convert value to string, handling null/undefined
        const stringValue = value === null || value === undefined ? "" : String(value);
        return escapeCsvField(stringValue);
      });
      csvLines.push(row.join(","));
    });

    return csvLines.join("\n");
  };

  /**
   * Validate file extension
   */
  const validateFileExtension = (fileName: string): void => {
    const lowerName = fileName.toLowerCase();
    if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".json")) {
      throw new Error(
        `Invalid file type. Expected .csv or .json file, but received: ${fileName}`
      );
    }
  };

  /**
   * Validate JSON structure before processing
   */
  const validateJsonStructure = (content: string): void => {
    const trimmedContent = content.trim();
    
    // Must start with array bracket
    if (!trimmedContent.startsWith("[")) {
      throw new Error("Invalid JSON: File must be an array starting with '['");
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmedContent);
    } catch (e) {
      throw new Error(
        `Invalid JSON format: ${e instanceof Error ? e.message : "Parse error"}`
      );
    }

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid JSON: Root element must be an array");
    }

    if (parsed.length === 0) {
      throw new Error("Invalid JSON: Array is empty");
    }

    // Validate all items are objects
    for (let i = 0; i < parsed.length; i++) {
      if (
        typeof parsed[i] !== "object" ||
        parsed[i] === null ||
        Array.isArray(parsed[i])
      ) {
        throw new Error(
          `Invalid JSON: Item at index ${i} is not an object. All array items must be objects.`
        );
      }
    }
  };

  /**
   * Validate CSV structure before processing
   */
  const validateCsvStructure = (content: string): void => {
    const trimmedContent = content.trim();
    
    if (trimmedContent.length === 0) {
      throw new Error("Invalid CSV: File is empty");
    }

    const lines = trimmedContent.split(/\r?\n/).filter((line) => line.trim() !== "");
    
    if (lines.length === 0) {
      throw new Error("Invalid CSV: No data found");
    }

    if (lines.length < 2) {
      throw new Error("Invalid CSV: File must contain at least a header row and one data row");
    }

    // Parse header to get expected column count (with line number for error reporting)
    let headerValues: string[];
    try {
      headerValues = parseCsvLine(lines[0], 1);
    } catch (e) {
      throw new Error(`Invalid CSV: ${e instanceof Error ? e.message : "Error parsing header row"}`);
    }

    if (headerValues.length === 0) {
      throw new Error("Invalid CSV: Header row is empty");
    }

    // Check for empty headers
    if (headerValues.some((h) => h === "")) {
      throw new Error("Invalid CSV: Header row contains empty column names");
    }

    // Validate all data rows have consistent column count
    for (let i = 1; i < lines.length; i++) {
      let rowValues: string[];
      try {
        rowValues = parseCsvLine(lines[i], i + 1);
      } catch (e) {
        throw new Error(
          `Invalid CSV: ${e instanceof Error ? e.message : `Error parsing row ${i + 1}`}`
        );
      }

      if (rowValues.length !== headerValues.length) {
        throw new Error(
          `Invalid CSV: Row ${i + 1} has ${rowValues.length} columns, but header has ${headerValues.length} columns`
        );
      }
    }
  };

  /**
   * Detect file format based on file name and content
   */
  const detectFormat = (fileName: string, content: string): FileFormat => {
    const lowerName = fileName.toLowerCase();
    if (lowerName.endsWith(".csv")) {
      return "csv";
    }
    if (lowerName.endsWith(".json")) {
      return "json";
    }

    // If extension doesn't match, don't try to auto-detect
    // This ensures we only process files with correct extensions
    return null;
  };

  /**
   * Process a file and convert it
   * Stops immediately on any validation error
   */
  const processFile = async (file: File) => {
    // Clear all state immediately
    setError("");
    setFileFormat(null);
    setConvertedContent("");
    setFileName("");

    try {
      // Step 1: Validate file extension FIRST - stop immediately if invalid
      validateFileExtension(file.name);
      setFileName(file.name);

      // Step 2: Read file content
      const content = await file.text();

      // Step 3: Detect format based on extension
      const format = detectFormat(file.name, content);
      if (!format) {
        throw new Error(
          "Could not determine file format. File must have .csv or .json extension."
        );
      }

      // Step 4: Validate file structure BEFORE processing - stop immediately if invalid
      if (format === "csv") {
        validateCsvStructure(content);
        // Only proceed if validation passes
        setFileFormat(format);
        const jsonResult = csvToJson(content);
        setConvertedContent(jsonResult);
      } else if (format === "json") {
        validateJsonStructure(content);
        // Only proceed if validation passes
        setFileFormat(format);
        const csvResult = jsonToCsv(content);
        setConvertedContent(csvResult);
      }
    } catch (err) {
      // On any error, stop immediately and clear all state
      setError(err instanceof Error ? err.message : "An error occurred processing the file");
      setFileFormat(null);
      setConvertedContent("");
      setFileName("");
      // Reset file input
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    }
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await processFile(file);
  };

  /**
   * Handle drag and drop events
   */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) {
      return;
    }

    // Only accept files with .csv or .json extension
    const file = files.find((f) => 
      f.name.toLowerCase().endsWith(".csv") || 
      f.name.toLowerCase().endsWith(".json")
    );

    if (file) {
      await processFile(file);
    } else {
      // Invalid file type - stop immediately
      setError(
        `Invalid file type. Expected .csv or .json file, but received: ${files[0].name}`
      );
      setFileFormat(null);
      setConvertedContent("");
      setFileName("");
    }
  };

  /**
   * Download the converted content
   */
  const handleDownload = () => {
    if (!convertedContent) return;

    const outputFormat = fileFormat === "csv" ? "json" : "csv";
    const extension = outputFormat === "json" ? ".json" : ".csv";
    const baseName = fileName.replace(/\.[^/.]+$/, "") || "converted";
    const downloadName = `${baseName}${extension}`;

    const blob = new Blob([convertedContent], {
      type: outputFormat === "json" ? "application/json" : "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Reset the tool
   */
  const handleReset = () => {
    setFileFormat(null);
    setConvertedContent("");
    setError("");
    setFileName("");
    // Reset file input
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div
      className={`flex flex-col h-full min-h-screen p-6 transition-colors ${
        isDragging
          ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-lg"
          : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        CSV ↔ JSON Converter
      </h1>

      {/* File Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Upload File
        </label>
        <div className="flex items-center gap-4">
          <label
            htmlFor="file-input"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Choose File
          </label>
          <input
            id="file-input"
            type="file"
            accept=".csv,.json"
            onChange={handleFileUpload}
            className="hidden"
          />
          {fileName && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {fileName}
            </span>
          )}
          {fileFormat && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              → {fileFormat === "csv" ? "JSON" : "CSV"}
            </span>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Converted Content Section */}
      {convertedContent && (
        <div className="flex-1 flex flex-col mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Converted Content ({fileFormat === "csv" ? "JSON" : "CSV"})
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Download
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Reset
              </button>
            </div>
          </div>
          <textarea
            value={convertedContent}
            readOnly
            className="flex-1 w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Converted content will appear here..."
          />
        </div>
      )}

      {/* Instructions */}
      {!convertedContent && !error && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            How it works:
          </h2>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Drag and drop a CSV or JSON file, or click "Choose File" to upload</li>
            <li>Upload a CSV file to convert it to JSON (first line becomes the schema)</li>
            <li>Upload a JSON file (array of objects) to convert it to CSV</li>
            <li>All fields are properly escaped and delimited</li>
            <li>For JSON to CSV, all unique keys across all objects become the CSV headers</li>
          </ul>
        </div>
      )}

      {/* Drag overlay message */}
      {isDragging && (
        <div className="fixed inset-0 flex items-center justify-center bg-blue-500/10 dark:bg-blue-500/20 z-50 pointer-events-none">
          <div className="bg-white dark:bg-gray-800 px-8 py-6 rounded-lg shadow-lg border-2 border-dashed border-blue-400 dark:border-blue-500">
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              Drop your CSV or JSON file here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

