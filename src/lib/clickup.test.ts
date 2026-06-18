import { describe, it, expect } from "vitest";
import {
  mapTask,
  sortByDueDate,
  extractOwner,
  normalizeName,
  matchOwnerToRoster,
  type ClickUpTaskView,
  type RosterEntry,
} from "./clickup";

function task(partial: Partial<ClickUpTaskView> & { id: string }): ClickUpTaskView {
  return {
    id: partial.id,
    name: partial.name ?? partial.id,
    status: partial.status ?? "",
    statusColor: partial.statusColor ?? "",
    dueDate: partial.dueDate ?? null,
    priority: partial.priority ?? null,
    listName: partial.listName ?? "",
    folderName: partial.folderName ?? "",
    ownerName: partial.ownerName ?? null,
    url: partial.url ?? "",
  };
}

describe("extractOwner", () => {
  it("reads a trailing parenthetical owner", () => {
    expect(extractOwner("Database and HRMS (Rahman)")).toBe("Rahman");
    expect(extractOwner("RM 3 (Manjeet)")).toBe("Manjeet");
    expect(extractOwner("1.1 CEO Office ToDo List (Manjeet)")).toBe("Manjeet");
  });
  it("reads an 'Intern - Name' owner", () => {
    expect(extractOwner("3.6.9 Intern - Yee Qian")).toBe("Yee Qian");
    expect(extractOwner("Intern - Amir")).toBe("Amir");
  });
  it("returns null when no owner pattern is present", () => {
    expect(extractOwner("HR -HOD TO DO LIST")).toBeNull();
    expect(extractOwner("")).toBeNull();
    expect(extractOwner(null)).toBeNull();
  });
});

describe("normalizeName", () => {
  it("lowercases, trims, and collapses whitespace", () => {
    expect(normalizeName("  Yee   Qian ")).toBe("yee qian");
    expect(normalizeName(null)).toBe("");
  });
});

describe("matchOwnerToRoster", () => {
  const roster: RosterEntry[] = [
    { userId: 1, fullName: "Izzuddin Bin Nor Rahman", nickName: "Izzuddin", departmentId: 5 },
    { userId: 2, fullName: "Manjeet Kaur A/P Jasbinder Singh", nickName: "Manjeet", departmentId: 5 },
    { userId: 3, fullName: "Didisabarini Binti Mohd", nickName: "Didi", departmentId: 7 },
  ];

  it("matches on exact nick_name", () => {
    expect(matchOwnerToRoster("Manjeet", roster)).toBe(2);
    expect(matchOwnerToRoster("didi", roster)).toBe(3);
  });
  it("matches a whole word inside full_name when no nick matches", () => {
    expect(matchOwnerToRoster("Rahman", roster)).toBe(1);
  });
  it("returns null for unknown or too-short owners", () => {
    expect(matchOwnerToRoster("Amir", roster)).toBeNull();
    expect(matchOwnerToRoster("a", roster)).toBeNull();
    expect(matchOwnerToRoster(null, roster)).toBeNull();
  });
});

describe("mapTask", () => {
  it("maps a raw task and extracts the owner from the folder name", () => {
    expect(
      mapTask({
        id: "t1",
        name: "Do the thing",
        status: { status: "in progress", color: "#abc" },
        due_date: "1700000000000",
        priority: { priority: "high" },
        list: { name: "Friday" },
        folder: { name: "Database and HRMS (Rahman)" },
        url: "https://app.clickup.com/t/t1",
      }),
    ).toEqual<ClickUpTaskView>({
      id: "t1",
      name: "Do the thing",
      status: "in progress",
      statusColor: "#abc",
      dueDate: 1700000000000,
      priority: "high",
      listName: "Friday",
      folderName: "Database and HRMS (Rahman)",
      ownerName: "Rahman",
      url: "https://app.clickup.com/t/t1",
    });
  });

  it("handles null due_date, null priority, missing list/folder", () => {
    const view = mapTask({
      id: "t2",
      name: "No due date",
      status: { status: "to do", color: "#000" },
      due_date: null,
      priority: null,
      list: null,
      folder: null,
      url: "https://app.clickup.com/t/t2",
    });
    expect(view.dueDate).toBeNull();
    expect(view.priority).toBeNull();
    expect(view.listName).toBe("");
    expect(view.folderName).toBe("");
    expect(view.ownerName).toBeNull();
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
