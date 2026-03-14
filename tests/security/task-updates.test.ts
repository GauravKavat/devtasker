import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { parseBulkTaskUpdates, parseTaskUpdate } from "../../lib/security/task-updates.ts";

test("parseTaskUpdate accepts valid task fields", () => {
  const result = parseTaskUpdate({
    title: "Fix auth",
    column_id: "column-1",
    position: 3,
    description: null,
  });

  assert.equal(result.title, "Fix auth");
  assert.equal(result.column_id, "column-1");
  assert.equal(result.position, 3);
  assert.equal(result.description, null);
});

test("parseTaskUpdate rejects unknown keys", () => {
  assert.throws(() => parseTaskUpdate({ title: "Fix", owner_id: "bad" }), ZodError);
});

test("parseBulkTaskUpdates rejects invalid field types", () => {
  assert.throws(
    () =>
      parseBulkTaskUpdates({
        updates: [
          {
            id: "task-1",
            position: "first",
          },
        ],
      }),
    ZodError,
  );
});

test("parseBulkTaskUpdates preserves valid bulk updates", () => {
  const updates = parseBulkTaskUpdates({
    updates: [
      { id: "task-1", column_id: "column-2", position: 1 },
      { id: "task-2", title: "Retitle" },
    ],
  });

  assert.equal(updates.length, 2);
  assert.equal(updates[0].column_id, "column-2");
  assert.equal(updates[1].title, "Retitle");
});
