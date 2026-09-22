// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { HelperTask } from "@shared/bridge-types";
import { HelperThread } from "./HelperThread";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function task(overrides: Partial<HelperTask> = {}): HelperTask {
  return {
    id: "task-1",
    agent: "researcher",
    label: "Research the API",
    prompt: "Look into the auth flow",
    status: "running",
    createdAt: "2026-09-22T10:00:00.000Z",
    startedAt: "2026-09-22T10:00:00.000Z",
    turns: 1,
    toolCalls: 1,
    thread: {
      version: 1,
      dropped: 0,
      items: [
        { kind: "text", text: "Investigate the auth flow." },
        { kind: "thinking", text: "Checking the token refresh path first." },
        { kind: "tool", callId: "call-1", name: "Read", args: { path: "src/auth.ts" }, output: "file contents", running: false },
        { kind: "text", text: "Found the refresh logic." },
        { kind: "note", text: "Needs a decision on token TTL." },
      ],
    },
    ...overrides,
  };
}

describe("HelperThread", () => {
  it("renders Task, Plan, Step, Update and Note rows with their labels", () => {
    render(<HelperThread task={task()} showToolDetails={false} followLive={false} />);

    expect(screen.getByText("Task")).toBeInTheDocument();
    expect(screen.getByText("Investigate the auth flow.")).toBeInTheDocument();
    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByText("Checking the token refresh path first.")).toBeInTheDocument();
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Read src/auth.ts")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
    expect(screen.getByText("Found the refresh logic.")).toBeInTheDocument();
    expect(screen.getByText("Note")).toBeInTheDocument();
    expect(screen.getByText("Needs a decision on token TTL.")).toBeInTheDocument();
  });

  it("renders the task title, status pill and origin line", () => {
    render(<HelperThread task={task()} showToolDetails={false} followLive={false} />);

    expect(screen.getByRole("heading", { name: "Research the API" })).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("started from this chat · researcher")).toBeInTheDocument();
  });

  it("hides tool args/output by default and shows them when showToolDetails is on", () => {
    const { rerender } = render(<HelperThread task={task()} showToolDetails={false} followLive={false} />);
    expect(screen.queryByText(/file contents/)).not.toBeInTheDocument();

    rerender(<HelperThread task={task()} showToolDetails followLive={false} />);
    expect(screen.getByText(/file contents/)).toBeInTheDocument();
  });

  it("marks a running tool item with a live indicator and a failed one with an error mark", () => {
    const withRunningTool = task({
      thread: {
        version: 1,
        dropped: 0,
        items: [{ kind: "tool", callId: "call-1", name: "Bash", args: { command: "pnpm test" }, running: true }],
      },
    });
    const { container: runningContainer } = render(<HelperThread task={withRunningTool} showToolDetails={false} followLive={false} />);
    expect(screen.getByTestId("gc-helper-thread")).toHaveTextContent("Bash pnpm test");
    expect(runningContainer.querySelector(".gc-helper-thread-item__tool-dot")).not.toBeNull();

    const withFailedTool = task({
      thread: {
        version: 1,
        dropped: 0,
        items: [{ kind: "tool", callId: "call-2", name: "Bash", args: {}, running: false, isError: true }],
      },
    });
    const { container: failedContainer } = render(<HelperThread task={withFailedTool} showToolDetails={false} followLive={false} />);
    expect(failedContainer.querySelector(".gc-helper-thread-item__tool-error")).not.toBeNull();
  });

  it("renders a placeholder when the thread has no items yet", () => {
    render(<HelperThread task={task({ thread: { version: 0, dropped: 0, items: [] } })} showToolDetails={false} followLive={false} />);
    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
  });

  it("keeps the follow-live sentinel inside the scrolling items container", () => {
    const { container } = render(<HelperThread task={task()} showToolDetails={false} followLive={false} />);

    const scrollContainer = container.querySelector(".gc-helper-thread__items");
    const sentinel = screen.getByTestId("helper-thread-end");

    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer).toContainElement(sentinel);
  });

  it("auto-scrolls the sentinel while Follow live is on and stops once it is turned off", () => {
    const spy = Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>;
    const items = task().thread.items;

    const { rerender } = render(<HelperThread task={task()} showToolDetails={false} followLive={false} />);
    expect(spy).not.toHaveBeenCalled();

    rerender(<HelperThread task={task({ thread: { version: 1, dropped: 0, items } })} showToolDetails={false} followLive />);
    expect(spy).toHaveBeenCalled();

    spy.mockClear();
    rerender(
      <HelperThread
        task={task({ thread: { version: 2, dropped: 0, items: [...items, { kind: "note", text: "one more" }] } })}
        showToolDetails={false}
        followLive={false}
      />,
    );
    expect(spy).not.toHaveBeenCalled();
  });
});
