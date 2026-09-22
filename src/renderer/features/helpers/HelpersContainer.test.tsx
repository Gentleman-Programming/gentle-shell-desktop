// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { HelperTask, HelpersActivity } from "@shared/bridge-types";
import { HelpersContainer } from "./HelpersContainer";

function task(overrides: Partial<HelperTask> = {}): HelperTask {
  return {
    id: "task-1",
    agent: "a",
    label: "Task",
    prompt: "p",
    status: "queued",
    createdAt: "2026-09-22T10:00:00.000Z",
    turns: 0,
    toolCalls: 0,
    thread: { version: 0, dropped: 0, items: [] },
    ...overrides,
  };
}

function activity(tasks: HelperTask[]): HelpersActivity {
  return {
    summary: {
      running: tasks.filter((t) => t.status === "running").length,
      queued: tasks.filter((t) => t.status === "queued").length,
      waiting: tasks.filter((t) => t.status === "waiting").length,
      finished: tasks.filter((t) => t.status === "done" || t.status === "failed" || t.status === "cancelled").length,
    },
    tasks,
  };
}

describe("HelpersContainer", () => {
  it("selects the first running task by default", () => {
    const tasks = [
      task({ id: "1", label: "Queued task", status: "queued" }),
      task({ id: "2", label: "Running task", status: "running", startedAt: "2026-09-22T10:00:00.000Z" }),
    ];
    render(<HelpersContainer activity={activity(tasks)} onBackToChat={() => {}} />);

    expect(screen.getByRole("heading", { name: "Running task" })).toBeInTheDocument();
  });

  it("falls back to the first task when none are running", () => {
    const tasks = [task({ id: "1", label: "Only task", status: "queued" })];
    render(<HelpersContainer activity={activity(tasks)} onBackToChat={() => {}} />);

    expect(screen.getByRole("heading", { name: "Only task" })).toBeInTheDocument();
  });

  it("switches the thread when a different helper is selected from the list", () => {
    const tasks = [task({ id: "1", label: "First" }), task({ id: "2", label: "Second" })];
    render(<HelpersContainer activity={activity(tasks)} onBackToChat={() => {}} />);

    fireEvent.click(screen.getByText("Second"));

    expect(screen.getByRole("heading", { name: "Second" })).toBeInTheDocument();
  });

  it("keeps the current selection across an activity update even after the selected task finishes", () => {
    const initial = [task({ id: "1", label: "First", status: "running", startedAt: "2026-09-22T10:00:00.000Z" })];
    const { rerender } = render(<HelpersContainer activity={activity(initial)} onBackToChat={() => {}} />);
    expect(screen.getByRole("heading", { name: "First" })).toBeInTheDocument();

    const updated = [
      task({ id: "1", label: "First", status: "done", startedAt: "2026-09-22T10:00:00.000Z", endedAt: "2026-09-22T10:00:05.000Z" }),
    ];
    rerender(<HelpersContainer activity={activity(updated)} onBackToChat={() => {}} />);

    expect(screen.getByRole("heading", { name: "First" })).toBeInTheDocument();
  });

  it("follows a newly-running task once the previously selected one is no longer in the list", () => {
    const initial = [task({ id: "1", label: "First", status: "running", startedAt: "2026-09-22T10:00:00.000Z" })];
    const { rerender } = render(<HelpersContainer activity={activity(initial)} onBackToChat={() => {}} />);
    expect(screen.getByRole("heading", { name: "First" })).toBeInTheDocument();

    const updated = [task({ id: "2", label: "Second", status: "running", startedAt: "2026-09-22T10:00:00.000Z" })];
    rerender(<HelpersContainer activity={activity(updated)} onBackToChat={() => {}} />);

    expect(screen.getByRole("heading", { name: "Second" })).toBeInTheDocument();
  });

  it("shows a placeholder in both panes when the chat has no helpers", () => {
    render(<HelpersContainer activity={activity([])} onBackToChat={() => {}} />);
    expect(screen.getByText("No helpers in this chat yet.")).toBeInTheDocument();
    expect(screen.getByText("Nothing running for this chat yet.")).toBeInTheDocument();
  });

  it("calls onBackToChat from the footer button", () => {
    let called = false;
    const tasks = [task({ id: "1", label: "First" })];
    render(<HelpersContainer activity={activity(tasks)} onBackToChat={() => (called = true)} />);

    fireEvent.click(screen.getByRole("button", { name: "Back to chat" }));

    expect(called).toBe(true);
  });

  it("hides tool details by default and shows them once the toggle is checked", () => {
    const tasks = [
      task({
        id: "1",
        label: "First",
        thread: {
          version: 0,
          dropped: 0,
          items: [{ kind: "tool", callId: "c1", name: "Read", args: { path: "x" }, output: "the output" }],
        },
      }),
    ];
    render(<HelpersContainer activity={activity(tasks)} onBackToChat={() => {}} />);

    expect(screen.queryByText(/the output/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: "Show tool details" }));

    expect(screen.getByText(/the output/)).toBeInTheDocument();
  });

  it("the Stop button is disabled with an explanatory title", () => {
    const tasks = [task({ id: "1", label: "First" })];
    render(<HelpersContainer activity={activity(tasks)} onBackToChat={() => {}} />);

    const stopButton = screen.getByRole("button", { name: "Stop" });
    expect(stopButton).toBeDisabled();
    expect(stopButton).toHaveAttribute("title", "Stopping helpers is not available yet");
  });
});
