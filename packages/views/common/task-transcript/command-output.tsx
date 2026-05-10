"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check, Terminal } from "lucide-react";
import { useT } from "../../i18n";

interface CommandOutputProps {
  output?: string;
}

export function CommandOutput({ output }: CommandOutputProps) {
  const { t } = useT("agents");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const text = output ?? "";
  const lines = text.split("\n");
  const isLong = lines.length > 50;
  const displayLines = expanded || !isLong ? lines : lines.slice(0, 50);
  const truncated = isLong && !expanded;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          <Terminal className="size-3 text-zinc-400 dark:text-zinc-500" />
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{t(($) => $.transcript.command_output)}</span>
          {isLong && (
            <span className="text-[10px] text-zinc-300 dark:text-zinc-600">
              ({t(($) => $.transcript.lines_count, { count: lines.length })})
            </span>
          )}
        </div>
        <button
          type="button"
          className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto p-3 text-[11px] leading-relaxed font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-all">
        {displayLines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
        {truncated && (
          <button
            type="button"
            className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            onClick={() => setExpanded(true)}
          >
            <ChevronDown className="size-3" />
            {t(($) => $.transcript.show_all_lines, { count: lines.length })}
          </button>
        )}
        {expanded && isLong && (
          <button
            type="button"
            className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
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
