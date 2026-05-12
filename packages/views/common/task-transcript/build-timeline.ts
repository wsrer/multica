import type { TaskMessagePayload } from "@multica/core/types/events";
import { redactSecrets } from "./redact";

/** A unified timeline entry: tool calls, thinking, text, and errors in chronological order. */
export interface TimelineItem {
  seq: number;
  type: "tool_use" | "tool_result" | "thinking" | "text" | "error";
  tool?: string;
  content?: string;
  input?: Record<string, unknown>;
  output?: string;
  meta?: Record<string, unknown>;
  created_at?: string;
}

/** Tool names that execute shell commands. */
const COMMAND_TOOLS = new Set(["Bash", "exec_command", "terminal", "Run command"]);

/** Tool names that modify files (edits, writes, patches). */
const EDIT_TOOLS = new Set([
  "Edit", "Write", "patch_apply", "edit_file", "write_file", "patch",
  "multi_edit", "multiedit",
]);

export function isCommandTool(tool?: string): boolean {
  return tool != null && COMMAND_TOOLS.has(tool);
}

export function isEditTool(tool?: string): boolean {
  return tool != null && EDIT_TOOLS.has(tool);
}

/** Build a chronologically ordered timeline from raw task messages. */
export function buildTimeline(msgs: TaskMessagePayload[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const msg of msgs) {
    items.push({
      seq: msg.seq,
      type: msg.type,
      tool: msg.tool,
      content: msg.content ? redactSecrets(msg.content) : msg.content,
      input: msg.input,
      output: msg.output ? redactSecrets(msg.output) : msg.output,
      meta: msg.meta,
      created_at: msg.created_at,
    });
  }
  return items.sort((a, b) => a.seq - b.seq);
}
