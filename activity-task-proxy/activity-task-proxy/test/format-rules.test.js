import test from "node:test";
import assert from "node:assert/strict";
import { normalizeResult } from "../src/format.js";

test("cleans invalid deadlines, fake owners, and infers hotel module", () => {
  const result = normalizeResult({
    project: "Piaget晚宴",
    modules: [{
      name: "其他",
      tasks: [{
        title: "安排员工酒店",
        detail: "下周安排酒店住宿",
        owner: "未命名项目",
        deadline: "2"
      }]
    }]
  });
  assert.equal(result.modules[0].name, "酒店");
  assert.equal(result.modules[0].tasks[0].owner, "");
  assert.equal(result.modules[0].tasks[0].deadline, "");
});
