"use client";

import { useEffect, useState } from "react";

type LatexDisplayProps = {
  latex: string;
  onChange: (value: string) => void;
};

export default function LatexDisplay({ latex, onChange }: LatexDisplayProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(latex);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = latex;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
  };

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          LaTeX output
        </h2>
        {latex && (
          <button
            type="button"
            onClick={copyToClipboard}
            className={`rounded-md border px-3 py-1 text-xs font-medium transition-all duration-300 ease-in-out ${
              copied
                ? "border-green-700/30 bg-green-800/15 text-green-800 dark:border-green-600/40 dark:bg-green-950/60 dark:text-green-300"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>

      <textarea
        value={latex}
        onChange={(e) => onChange(e.target.value)}
        placeholder="LaTeX output will appear here after conversion. You can edit it directly."
        spellCheck={false}
        className="max-h-48 min-h-28 w-full resize-y overflow-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm leading-relaxed text-zinc-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-500"
      />
    </div>
  );
}
