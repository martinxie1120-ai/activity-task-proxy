import test from "node:test";
import assert from "node:assert/strict";
import { extractJson, normalizeResult, toAppleNotesMarkdown } from "../src/format.js";

test("normalizes tasks and creates Apple Notes markdown", () => {
  const result = normalizeResult(extractJson('```json\n{"project":"Piaget晚宴","modules":[{"name":"家具","tasks":[{"title":"确认采购清单","detail":"周五前给客户确认"}]}]}\n```'));
  assert.equal(result.project, "Piaget晚宴");
  assert.equal(result.modules[0].tasks[0].status, "todo");
  assert.match(toAppleNotesMarkdown(result), /☐ 确认采购清单/);
});
