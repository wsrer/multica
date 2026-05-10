"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useT } from "../../i18n";

interface DiffViewerProps {
  /** Raw output text that may contain a unified diff */
  output?: string;
  /** Structured diff data (old/new text) from ACP-style backends */
  oldText?: string;
  newText?: string;
}

interface DiffLine {
  type: "add" | "del" | "context" | "header";
  text: string;
}

function parseUnifiedDiff(text: string): DiffLine[] {
  const lines: DiffLine[] = [];
  for (const line of text.split("\n")) {
    if (line.startsWith("+++ ") || line.startsWith("--- ") || line.startsWith("@@")) {
      lines.push({ type: "header", text: line });
    } else if (line.startsWith("+")) {
      lines.push({ type: "add", text: line });
    } else if (line.startsWith("-")) {
      lines.push({ type: "del", text: line });
    } else {
      lines.push({ type: "context", text: line });
    }
  }
  return lines;
}

function generateStructuredDiff(oldText: string, newText: string): DiffLine[] {
  const lines: DiffLine[] = [];
  lines.push({ type: "header", text: "--- a/file" });
  lines.push({ type: "header", text: "+++ b/file" });

  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  for (const l of oldLines) {
    lines.push({ type: "del", text: `-${l}` });
  }
  for (const l of newLines) {
    lines.push({ type: "add", text: `+${l}` });
  }

  return lines;
}

export function DiffViewer({ output, oldText, newText }: DiffViewerProps) {
  const { t } = useT("agents");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  let hunkLines: DiffLine[];
  if (oldText != null && newText != null) {
    hunkLines = generateStructuredDiff(oldText, newText);
  } else if (output) {
    hunkLines = parseUnifiedDiff(output);
  } else {
    hunkLines = [];
  }

  const hasDiffMarkers = hunkLines.some(
    (l) => l.type === "add" || l.type === "del",
  );
  const isLong = hunkLines.length > 100;
  const displayLines = expanded || !isLong ? hunkLines : hunkLines.slice(0, 100);
  const truncated = !expanded && isLong;

  const handleCopy = async () => {
    const text = output ?? `${oldText ?? ""}\n→\n${newText ?? ""}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded">
      <div className="flex items-center justify-between bg-muted/60 px-3 py-1.5 border-b">
        <span className="text-[10px] text-muted-foreground">
          {hasDiffMarkers ? t(($) => $.transcript.file_changes) : t(($) => $.transcript.file_content)}
        </span>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto p-3 text-[11px] leading-relaxed font-mono whitespace-pre-wrap break-all">
        {displayLines.map((line, i) => (
          <div
            key={i}
            className={
              line.type === "add"
                ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : line.type === "del"
                  ? "bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                  : line.type === "header"
                    ? "text-blue-500 dark:text-blue-400"
                    : "text-muted-foreground"
            }
          >
            {line.text}
          </div>
        ))}
        {truncated && (
          <button
            type="button"
            className="flex items-center gap-1 mt-1 text-[10px] text-primary hover:underline cursor-pointer"
            onClick={() => setExpanded(true)}
          >
            <ChevronDown className="size-3" />
            {t(($) => $.transcript.show_all_lines, { count: hunkLines.length })}
          </button>
        )}
        {expanded && hunkLines.length > 100 && (
          <button
            type="button"
            className="flex items-center gap-1 mt-1 text-[10px] text-primary hover:underline cursor-pointer"
            onClick={() => setExpanded(false)}
          >
            <ChevronUp className="size-3" />
            {t(($) => $.transcript.collapse)}
          </button>
        )}
      </pre>
    </div>
  );
}
