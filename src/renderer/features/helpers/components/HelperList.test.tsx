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
  it("renders a status dot and title per current task", () => {
    const current = [
      task({ id: "1", label: "Migrate the config schema", status: "running" }),
      task({ id: "2", label: "Confirm the change", status: "waiting" }),
    ];
    render(<HelperList current={current} earlier={[]} onSelect={() => {}} />);

    expect(screen.getByText("Migrate the config schema")).toBeInTheDocument();
    expect(screen.getByText("Confirm the change")).toBeInTheDocument();
    expect(document.querySelector(".gc-helper-list-item__dot--running")).not.toBeNull();
    expect(document.querySelector(".gc-helper-list-item__dot--waiting")).not.toBeNull();
  });

  it("marks the selected task", () => {
    const current = [task({ id: "1" }), task({ id: "2" })];
    render(<HelperList current={current} earlier={[]} selectedTaskId="2" onSelect={() => {}} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[1]).toHaveAttribute("aria-current", "true");
    expect(buttons[0]).not.toHaveAttribute("aria-current");
  });

  it("calls onSelect with the clicked task", () => {
    const onSelect = vi.fn();
    const current = [task({ id: "1" }), task({ id: "2" })];
    render(<HelperList current={current} earlier={[]} onSelect={onSelect} />);

    fireEvent.click(screen.getAllByRole("button")[1]!);

    expect(onSelect).toHaveBeenCalledWith(current[1]);
  });

  it("shows an empty message when this chat has no helpers at all", () => {
    render(<HelperList current={[]} earlier={[]} onSelect={() => {}} />);
    expect(screen.getByText("No helpers in this chat yet.")).toBeInTheDocument();
  });

  it("does not render an Earlier group when there are no earlier helpers", () => {
    render(<HelperList current={[task({ id: "1" })]} earlier={[]} onSelect={() => {}} />);
    expect(screen.queryByRole("button", { name: /Earlier/ })).not.toBeInTheDocument();
  });

  describe("with an earlier group", () => {
    function earlierTasks(): HelperTask[] {
      return [
        task({ id: "e1", label: "Draft the migration plan", status: "done", endedAt: "2026-09-18T10:00:00.000Z" }),
        task({ id: "e2", label: "Check the staging deploy", status: "failed", endedAt: "2026-09-20T10:00:00.000Z" }),
      ];
    }

    it("renders a collapsed header with the count and a muted date hint, hiding earlier items by default", () => {
      render(<HelperList current={[task({ id: "1" })]} earlier={earlierTasks()} onSelect={() => {}} />);

      const toggle = screen.getByRole("button", { name: /Earlier · 2 finished/ });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByText("until Sep 20, 2026")).toBeInTheDocument();
      expect(screen.queryByText("Draft the migration plan")).not.toBeInTheDocument();
    });

    it("expands the earlier group on click, revealing its items", () => {
      render(<HelperList current={[task({ id: "1" })]} earlier={earlierTasks()} onSelect={() => {}} />);

      const toggle = screen.getByRole("button", { name: /Earlier · 2 finished/ });
      fireEvent.click(toggle);

      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Draft the migration plan")).toBeInTheDocument();
      expect(screen.getByText("Check the staging deploy")).toBeInTheDocument();
    });

    it("starts expanded when the selected task is inside the earlier group", () => {
      const earlier = earlierTasks();
      render(<HelperList current={[]} earlier={earlier} selectedTaskId="e1" onSelect={() => {}} />);

      expect(screen.getByRole("button", { name: /Earlier · 2 finished/ })).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Draft the migration plan")).toBeInTheDocument();
    });

    it("selecting an earlier item still calls onSelect with its task", () => {
      const onSelect = vi.fn();
      const earlier = earlierTasks();
      render(<HelperList current={[task({ id: "1" })]} earlier={earlier} onSelect={onSelect} />);

      fireEvent.click(screen.getByRole("button", { name: /Earlier · 2 finished/ }));
      fireEvent.click(screen.getByText("Draft the migration plan"));

      expect(onSelect).toHaveBeenCalledWith(earlier[0]);
    });
  });
});
