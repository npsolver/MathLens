"use client";

import { useCallback, useRef, useState } from "react";
import CameraCapture from "@/components/CameraCapture";

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/x-png",
  "image/webp",
  "application/pdf",
]);

const ACCEPTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

const EXAMPLE_IMAGE_PATH = "/examples/mathlens-example.png";

function isAcceptedFile(file: File): boolean {
  if (file.type && ACCEPTED_TYPES.has(file.type)) {
    return true;
  }

  const dotIndex = file.name.lastIndexOf(".");
  if (dotIndex === -1) {
    return false;
  }

  return ACCEPTED_EXTENSIONS.has(file.name.slice(dotIndex).toLowerCase());
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }

  const dotIndex = file.name.lastIndexOf(".");
  if (dotIndex === -1) {
    return false;
  }

  const ext = file.name.slice(dotIndex).toLowerCase();
  return ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp";
}

type FileUploadProps = {
  onFileSelect: (file: File) => void;
  onConvert: () => void;
  canConvert: boolean;
  converting?: boolean;
  disabled?: boolean;
};

export default function FileUpload({
  onFileSelect,
  onConvert,
  canConvert,
  converting = false,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!isAcceptedFile(file)) {
        alert("Please upload a JPEG, PNG, WebP, or PDF file.");
        return;
      }

      setFileName(file.name);
      onFileSelect(file);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      if (isImageFile(file)) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    },
    [onFileSelect, previewUrl],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const file = event.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile],
  );

  const loadExample = useCallback(async () => {
    if (disabled || loadingExample) {
      return;
    }

    setLoadingExample(true);
    try {
      const response = await fetch(EXAMPLE_IMAGE_PATH);
      if (!response.ok) {
        throw new Error("Failed to load example file.");
      }

      const blob = await response.blob();
      const file = new File([blob], "mathlens-example.png", {
        type: "image/png",
      });
      handleFile(file);
    } catch {
      alert("Could not load the example file.");
    } finally {
      setLoadingExample(false);
    }
  }, [disabled, loadingExample, handleFile]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative flex shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 transition-colors ${
          isDragging
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
            : "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50"
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <svg
          className="mb-2 h-8 w-8 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Drag and drop an image or PDF
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">JPEG, PNG, WebP, or PDF</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium whitespace-nowrap text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Choose file
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              setCameraOpen(true);
            }}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Take photo
          </button>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={disabled || loadingExample}
            onClick={(e) => {
              e.stopPropagation();
              void loadExample();
            }}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium whitespace-nowrap text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            {loadingExample ? "Loading…" : "Use example file"}
          </button>
          <button
            type="button"
            disabled={!canConvert || disabled || converting}
            onClick={(e) => {
              e.stopPropagation();
              onConvert();
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {converting ? "Converting…" : "Convert to LaTeX"}
          </button>
        </div>
      </div>

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleFile}
      />

      {fileName && (
        <p className="shrink-0 truncate text-sm text-zinc-500">
          Selected:{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {fileName}
          </span>
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        {previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewUrl}
            alt="Upload preview"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full min-h-0 items-center justify-center p-4">
            <p className="text-sm text-zinc-400">Photo preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
