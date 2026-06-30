"use client";

import { useMemo } from "react";
import katex from "katex";
import { parseLatexBlocks } from "@/lib/latex";

type LatexPreviewProps = {
  latex: string;
};

export default function LatexPreview({ latex }: LatexPreviewProps) {
  const previewHtml = useMemo(() => {
    if (!latex.trim()) {
      return null;
    }

    const blocks = parseLatexBlocks(latex);
    const rendered = blocks.map((block) => {
      try {
        return katex.renderToString(block.content, {
          displayMode: block.displayMode,
          throwOnError: false,
        });
      } catch {
        return `<pre class="text-sm text-red-600">${block.content}</pre>`;
      }
    });

    return rendered.join('<div class="my-4" aria-hidden="true"></div>');
  }, [latex]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <h2 className="shrink-0 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Preview
      </h2>

      {!previewHtml ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-500">
            KaTeX preview will appear here after conversion.
          </p>
        </div>
      ) : (
        <div
          className="katex-preview min-h-0 flex-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 text-center text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}
    </div>
  );
}
