import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { AgentTask } from "@multica/core/types/agent";
import type { TimelineItem } from "./build-timeline";
import { AgentTranscriptDialog } from "./agent-transcript-dialog";

vi.mock("@multica/core/api", () => ({
  api: {
    getAgent: vi.fn().mockResolvedValue(null),
    listRuntimes: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../actor-avatar", () => ({
  ActorAvatar: () => <span data-testid="avatar" />,
}));

vi.mock("../../i18n", () => ({
  useT: () => ({
    t: (_sel: unknown, params?: Record<string, unknown>) => {
      if (params?.count != null) return String(params.count);
      if (params?.shown != null && params?.total != null) return `${params.shown}/${params.total}`;
      return "t";
    },
  }),
}));

function makeTask(overrides: Partial<AgentTask> = {}): AgentTask {
  return {
    id: "task-1",
    agent_id: "agent-1",
    runtime_id: "rt-1",
    issue_id: "issue-1",
    status: "completed",
    priority: 0,
    dispatched_at: null,
    started_at: "2026-01-01T00:00:00Z",
    completed_at: "2026-01-01T00:01:00Z",
    result: null,
    error: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeItems(items: Array<Partial<TimelineItem> & { seq: number }>): TimelineItem[] {
  return items.map((item) => ({
    seq: item.seq,
    type: item.type ?? "text",
    created_at: item.created_at ?? "",
    content: item.content,
    tool: item.tool,
    input: item.input,
    output: item.output,
    meta: item.meta,
  }));
}

describe("AgentTranscriptDialog row timing", () => {
  it("shows per-item elapsed based on previous event, not cumulative from task start", () => {
    const task = makeTask({ started_at: "2026-01-01T00:00:00Z" });
    const items = makeItems([
      { seq: 1, created_at: "2026-01-01T00:00:05Z", content: "a" },
      { seq: 2, created_at: "2026-01-01T00:00:08Z", content: "b" },
      { seq: 3, created_at: "2026-01-01T00:00:15Z", content: "c" },
    ]);

    render(
      <AgentTranscriptDialog
        open
        onOpenChange={() => {}}
        task={task}
        items={items}
        agentName="agent"
      />,
    );

    expect(screen.queryByText("5s #1")).toBeNull();
    expect(screen.getByText("3s #2")).toBeTruthy();
    expect(screen.getByText("7s #3")).toBeTruthy();
    expect(document.querySelector(".w-14")).toBeTruthy();
  });

  it("does not reserve timestamp column width when all timestamps are missing", () => {
    const task = makeTask();
    const items = makeItems([
      { seq: 1, created_at: "", content: "a" },
      { seq: 2, created_at: "", content: "b" },
    ]);

    const { container } = render(
      <AgentTranscriptDialog
        open
        onOpenChange={() => {}}
        task={task}
        items={items}
        agentName="agent"
      />,
    );

    expect(container.querySelector(".w-14")).toBeNull();
  });

  it("shows per-item elapsed again after remount with historical timestamps", () => {
    const task = makeTask();
    const firstItems = makeItems([
      { seq: 1, created_at: "", content: "a" },
      { seq: 2, created_at: "", content: "b" },
    ]);
    const secondItems = makeItems([
      { seq: 1, created_at: "2026-01-01T00:00:02Z", content: "a" },
      { seq: 2, created_at: "2026-01-01T00:00:04Z", content: "b" },
    ]);

    const { container, rerender } = render(
      <AgentTranscriptDialog
        open
        onOpenChange={() => {}}
        task={task}
        items={firstItems}
        agentName="agent"
      />,
    );
    expect(container.querySelector(".w-14")).toBeNull();

    rerender(
      <AgentTranscriptDialog
        open
        onOpenChange={() => {}}
        task={task}
        items={secondItems}
        agentName="agent"
      />,
    );

    expect(screen.getByText("2s #2")).toBeTruthy();
  });

  it("uses normalized created_at from timeline so historical reopen keeps row elapsed", () => {
    const task = makeTask();
    const items = makeItems([
      {
        seq: 1,
        created_at: "2026-01-01T00:00:01Z",
        content: "a",
      },
      {
        seq: 2,
        created_at: "2026-01-01T00:00:04Z",
        content: "b",
      },
    ]);

    render(
      <AgentTranscriptDialog
        open
        onOpenChange={() => {}}
        task={task}
        items={items}
        agentName="agent"
      />,
    );

    expect(screen.getByText("3s #2")).toBeTruthy();
  });

  it("falls back to meta timestamp when created_at is missing", () => {
    const task = makeTask();
    const items = makeItems([
      {
        seq: 1,
        created_at: "",
        meta: { timestamp: "2026-01-01T00:00:01Z" },
        content: "a",
      },
      {
        seq: 2,
        created_at: "",
        meta: { timestamp: "2026-01-01T00:00:04Z" },
        content: "b",
      },
    ]);

    render(
      <AgentTranscriptDialog
        open
        onOpenChange={() => {}}
        task={task}
        items={items}
        agentName="agent"
      />,
    );

    expect(screen.getByText("3s #2")).toBeTruthy();
  });

  it("shows milliseconds when elapsed is under one second", () => {
    const task = makeTask();
    const items = makeItems([
      { seq: 1, created_at: "2026-01-01T00:00:01.000Z", content: "a" },
      { seq: 2, created_at: "2026-01-01T00:00:01.823Z", content: "b" },
    ]);

    render(
      <AgentTranscriptDialog
        open
        onOpenChange={() => {}}
        task={task}
        items={items}
        agentName="agent"
      />,
    );

    expect(screen.getByText("823ms #2")).toBeTruthy();
    expect(screen.queryByText("0s #2")).toBeNull();
  });
});
