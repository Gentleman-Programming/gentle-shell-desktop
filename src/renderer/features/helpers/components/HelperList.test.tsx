// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { HelperTask } from "@shared/bridge-types";
import { HelperList } from "./HelperList";

function task(overrides: Partial<HelperTask> = {}): HelperTask {
  return {
    id: "task-1",
    agent: "a",
    label: "Migrate the config schema",
    prompt: "p",
    status: "running",
    createdAt: "2026-09-22T10:00:00.000Z",
    startedAt: "2026-09-22T10:00:00.000Z",
    turns: 1,
    toolCalls: 1,
    thread: { version: 0, dropped: 0, items: [] },
    ...overrides,
  };
}

describe("HelperList", () => {
  it("renders a status dot and title per task", () => {
    const tasks = [
      task({ id: "1", label: "Migrate the config schema", status: "running" }),
      task({ id: "2", label: "Confirm the change", status: "waiting" }),
    ];
    render(<HelperList tasks={tasks} onSelect={() => {}} />);

    expect(screen.getByText("Migrate the config schema")).toBeInTheDocument();
    expect(screen.getByText("Confirm the change")).toBeInTheDocument();
    expect(document.querySelector(".gc-helper-list-item__dot--running")).not.toBeNull();
    expect(document.querySelector(".gc-helper-list-item__dot--waiting")).not.toBeNull();
  });

  it("marks the selected task", () => {
    const tasks = [task({ id: "1" }), task({ id: "2" })];
    render(<HelperList tasks={tasks} selectedTaskId="2" onSelect={() => {}} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toHaveAttribute("aria-current", "true");
    expect(buttons[0]).not.toHaveAttribute("aria-current");
  });

  it("calls onSelect with the clicked task", () => {
    const onSelect = vi.fn();
    const tasks = [task({ id: "1" }), task({ id: "2" })];
    render(<HelperList tasks={tasks} onSelect={onSelect} />);

    fireEvent.click(screen.getAllByRole("button")[1]!);

    expect(onSelect).toHaveBeenCalledWith(tasks[1]);
  });

  it("shows an empty message when this chat has no helpers", () => {
    render(<HelperList tasks={[]} onSelect={() => {}} />);
    expect(screen.getByText("No helpers in this chat yet.")).toBeInTheDocument();
  });
});
