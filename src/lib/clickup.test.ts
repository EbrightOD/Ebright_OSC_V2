import { describe, it, expect } from "vitest";
import { mapTask, sortByDueDate, buildIndividuals, type ClickUpTaskView } from "./clickup";

function task(partial: Partial<ClickUpTaskView> & { id: string }): ClickUpTaskView {
  return {
    id: partial.id,
    name: partial.name ?? partial.id,
    status: partial.status ?? "",
    statusColor: partial.statusColor ?? "",
    dueDate: partial.dueDate ?? null,
    priority: partial.priority ?? null,
    listName: partial.listName ?? "",
    url: partial.url ?? "",
    assigneeEmails: partial.assigneeEmails ?? [],
  };
}

describe("mapTask", () => {
  it("maps a raw ClickUp task, lowercasing assignee emails", () => {
    const raw = {
      id: "t1",
      name: "Do the thing",
      status: { status: "in progress", color: "#abc" },
      due_date: "1700000000000",
      priority: { priority: "high" },
      list: { name: "Sprint 1" },
      url: "https://app.clickup.com/t/t1",
      assignees: [{ email: "Alice@Ebright.MY" }, { email: "bob@ebright.my" }],
    };
    expect(mapTask(raw)).toEqual<ClickUpTaskView>({
      id: "t1",
      name: "Do the thing",
      status: "in progress",
      statusColor: "#abc",
      dueDate: 1700000000000,
      priority: "high",
      listName: "Sprint 1",
      url: "https://app.clickup.com/t/t1",
      assigneeEmails: ["alice@ebright.my", "bob@ebright.my"],
    });
  });

  it("handles null due_date, null priority, missing list and assignees", () => {
    const view = mapTask({
      id: "t2",
      name: "No due date",
      status: { status: "to do", color: "#000" },
      due_date: null,
      priority: null,
      list: null,
      url: "https://app.clickup.com/t/t2",
      assignees: null,
    });
    expect(view.dueDate).toBeNull();
    expect(view.priority).toBeNull();
    expect(view.listName).toBe("");
    expect(view.assigneeEmails).toEqual([]);
  });
});

describe("sortByDueDate", () => {
  it("sorts ascending by dueDate, nulls last", () => {
    const sorted = sortByDueDate([
      task({ id: "a", dueDate: null }),
      task({ id: "b", dueDate: 200 }),
      task({ id: "c", dueDate: 100 }),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["c", "b", "a"]);
  });
});

describe("buildIndividuals", () => {
  const tasks = [
    task({ id: "t1", dueDate: 200, assigneeEmails: ["alice@ebright.my"] }),
    task({ id: "t2", dueDate: 100, assigneeEmails: ["alice@ebright.my"] }),
    task({ id: "t3", dueDate: 50, assigneeEmails: ["bob@ebright.my"] }),
  ];

  it("assigns each individual their tasks (due-date sorted) and puts the viewer first", () => {
    const result = buildIndividuals(
      [
        { name: "Bob", email: "bob@ebright.my", linked: true },
        { name: "Alice", email: "alice@ebright.my", linked: true },
      ],
      tasks,
      "alice@ebright.my",
    );
    expect(result.map((i) => i.email)).toEqual(["alice@ebright.my", "bob@ebright.my"]);
    expect(result[0].tasks.map((t) => t.id)).toEqual(["t2", "t1"]);
    expect(result[1].tasks.map((t) => t.id)).toEqual(["t3"]);
  });

  it("matches assignee emails case-insensitively and gives unlinked people no tasks", () => {
    const result = buildIndividuals(
      [{ name: "Carol", email: "Carol@Ebright.MY", linked: false }],
      [task({ id: "t9", assigneeEmails: ["carol@ebright.my"] })],
      "someone@else.my",
    );
    expect(result[0].linked).toBe(false);
    expect(result[0].tasks).toEqual([]);
  });
});
