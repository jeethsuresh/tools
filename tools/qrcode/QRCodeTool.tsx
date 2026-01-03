"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import { ToolProps } from "@/types/tool";

export default function QRCodeTool({}: ToolProps) {
  const searchParams = useSearchParams();
  const [text, setText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isUrlQrCode, setIsUrlQrCode] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanAreaRef = useRef<HTMLDivElement>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);

  // Check for query parameter on mount
  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const decoded = decodeURIComponent(escape(atob(dataParam)));
        setText(decoded);
        // Clear the query parameter from URL after reading
        const url = new URL(window.location.href);
        url.searchParams.delete("data");
        url.searchParams.delete("tool");
        window.history.replaceState({}, "", url.toString());
      } catch (error) {
        console.error("Error decoding query parameter:", error);
      }
    }
  }, [searchParams]);

  // Generate URL with base64 encoded text
  const generateUrl = () => {
    if (!text.trim()) return "";
    try {
      const base64 = btoa(unescape(encodeURIComponent(text)));
      const currentUrl = window.location.origin + window.location.pathname;
      return `${currentUrl}?tool=qrcode&data=${encodeURIComponent(base64)}`;
    } catch (error) {
      console.error("Error encoding text:", error);
      return "";
    }
  };

  // Start scanning
  const startScanning = async () => {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support camera access. Please use a modern browser.");
        return;
      }

      // Request camera permissions explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // Use back camera
        });
        // Stop the stream immediately - we just needed permission
        stream.getTracks().forEach((track) => track.stop());
      } catch (permissionError) {
        if (permissionError instanceof Error) {
          if (permissionError.name === "NotAllowedError" || permissionError.name === "PermissionDeniedError") {
            alert("Camera permission denied. Please allow camera access in your browser settings and try again.");
          } else if (permissionError.name === "NotFoundError" || permissionError.name === "DevicesNotFoundError") {
            alert("No camera found. Please connect a camera and try again.");
          } else {
            alert(`Failed to access camera: ${permissionError.message}`);
          }
        } else {
          alert("Failed to access camera. Please ensure camera permissions are granted.");
        }
        return;
      }

      // Set scanning state first so the element is rendered
      setIsScanning(true);
    } catch (error) {
      console.error("Error requesting permissions:", error);
      if (error instanceof Error) {
        alert(`Failed to request camera: ${error.message}`);
      } else {
        alert("Failed to start camera scanner. Please try again.");
      }
    }
  };

  // Stop scanning
  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Initialize scanner when element becomes available
  useEffect(() => {
    if (isScanning && qrReaderRef.current && !scannerRef.current) {
      const initializeScanner = async () => {
        try {
          const html5QrCode = new Html5Qrcode(qrReaderRef.current!.id);
          scannerRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: "environment" }, // Use back camera
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              // Successfully scanned
              setText(decodedText);
              stopScanning();
            },
            (errorMessage) => {
              // Ignore scanning errors (they're frequent during scanning)
            }
          );
        } catch (error) {
          console.error("Error initializing scanner:", error);
          setIsScanning(false);
          if (error instanceof Error) {
            alert(`Failed to start scanner: ${error.message}`);
          } else {
            alert("Failed to start camera scanner. Please try again.");
          }
        }
      };

      initializeScanner();
    }
  }, [isScanning, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const qrValue = isUrlQrCode ? generateUrl() : text;

  return (
    <div className="flex flex-col h-full min-h-screen p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        QR Code Generator & Scanner
      </h1>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Left side - Text input and controls */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Text to encode:
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isUrlQrCode}
                onChange={(e) => setIsUrlQrCode(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                URL QR code
              </span>
            </label>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Enter text to generate QR code, or scan a QR code..."
          />

          {isUrlQrCode && text && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                Generated URL:
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 break-all font-mono">
                {generateUrl()}
              </p>
            </div>
          )}

          {/* Scan button */}
          <div className="flex gap-3">
            {!isScanning ? (
              <button
                onClick={startScanning}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Start Scanning
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Stop Scanning
              </button>
            )}
            <button
              onClick={() => setText("")}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Right side - QR code display and scanner */}
        <div className="flex-1 flex flex-col gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            QR Code:
          </label>

          {isScanning ? (
            <div
              ref={scanAreaRef}
              className="flex-1 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 overflow-hidden"
            >
              <div ref={qrReaderRef} id="qr-reader" className="w-full h-full" />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 p-8">
              {qrValue ? (
                <div className="flex flex-col items-center gap-4">
                  <QRCodeSVG
                    value={qrValue}
                    size={256}
                    level="M"
                    includeMargin={true}
                    className="bg-white p-4 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                    {isUrlQrCode
                      ? "Scan this QR code to open the URL and decode the text"
                      : "Scan this QR code to read the text"}
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 text-center">
                  Enter text above to generate a QR code
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

