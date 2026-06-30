"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import LatexDisplay from "@/components/LatexDisplay";
import LatexPreview from "@/components/LatexPreview";
import { convertImageToLatex } from "@/lib/api";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [latex, setLatex] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!selectedFile) {
      setError("Please upload an image or PDF first.");
      return;
    }

    setLoading(true);
    setError(null);
    setLatex("");

    try {
      const result = await convertImageToLatex(selectedFile);
      setLatex(result.latex);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="shrink-0 px-6 pb-4 pt-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          MathLens
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Upload a photo or PDF of a math equation and get LaTeX instantly.
        </p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 px-6 pb-6">
        <section className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <FileUpload
            onFileSelect={(file) => {
              setSelectedFile(file);
              setError(null);
              setLatex("");
            }}
            onConvert={handleConvert}
            canConvert={!!selectedFile}
            converting={loading}
            disabled={loading}
          />

          {error && (
            <p className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}
        </section>

        <section className="flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain">
          <LatexDisplay latex={latex} onChange={setLatex} />
          <LatexPreview latex={latex} />
        </section>
      </div>
    </main>
  );
}
