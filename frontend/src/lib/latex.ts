export type LatexBlock = {
  content: string;
  displayMode: boolean;
};

function stripDelimiters(chunk: string): LatexBlock {
  const trimmed = chunk.trim();

  const bracketMatch = trimmed.match(/^\\\[([\s\S]*?)\\]$/);
  if (bracketMatch) {
    return { content: bracketMatch[1].trim(), displayMode: true };
  }

  const displayDollarMatch = trimmed.match(/^\$\$([\s\S]*?)\$\$$/);
  if (displayDollarMatch) {
    return { content: displayDollarMatch[1].trim(), displayMode: true };
  }

  const inlineDollarMatch = trimmed.match(/^\$([\s\S]*?)\$$/);
  if (inlineDollarMatch) {
    return { content: inlineDollarMatch[1].trim(), displayMode: false };
  }

  return { content: trimmed, displayMode: true };
}

/** Split model output into KaTeX-ready math blocks. */
export function parseLatexBlocks(latex: string): LatexBlock[] {
  return latex
    .trim()
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map(stripDelimiters);
}
