import { describe, expect, it } from "vitest";
import type { TaskMessagePayload } from "@multica/core/types/events";
import { buildTimeline } from "./build-timeline";

function makeMsg(overrides: Partial<TaskMessagePayload> = {}): TaskMessagePayload {
  return {
    task_id: "task-1",
    issue_id: "issue-1",
    seq: 1,
    type: "text",
    ...overrides,
  };
}

describe("buildTimeline", () => {
  it("normalizes missing created_at to empty string", () => {
    const items = buildTimeline([
      makeMsg({ seq: 1, created_at: undefined, content: "hello" }),
    ]);

    expect(items).toHaveLength(1);
    expect(items[0]?.created_at).toBe("");
  });

  it("sorts timeline items by seq ascending", () => {
    const items = buildTimeline([
      makeMsg({ seq: 3, content: "third" }),
      makeMsg({ seq: 1, content: "first" }),
      makeMsg({ seq: 2, content: "second" }),
    ]);

    expect(items.map((i) => i.seq)).toEqual([1, 2, 3]);
  });
});
