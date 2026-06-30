"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CameraCaptureProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export default function CameraCapture({
  open,
  onClose,
  onCapture,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      setError(null);
      return;
    }

    let cancelled = false;

    async function startCamera() {
      setStarting(true);
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access is not supported in this browser.");
        setStarting(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        if (!cancelled) {
          setError(
            "Could not access the camera. Check permissions and try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setStarting(false);
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }

        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stopStream();
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Take a photo
          </h3>
        </div>

        <div className="relative aspect-[4/3] bg-black">
          {starting && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white">
              Starting camera…
            </div>
          )}

          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-red-300">
              {error}
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!!error || starting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Capture
          </button>
        </div>
      </div>
    </div>
  );
}
