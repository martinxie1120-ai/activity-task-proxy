const MODULES = new Set(["家具", "场地", "制作", "供应商", "人员", "酒店", "餐饮", "其他"]);

export function normalizeResult(value) {
  const project = typeof value?.project === "string" && value.project.trim()
    ? value.project.trim()
    : "未命名项目";

  const modules = Array.isArray(value?.modules) ? value.modules : [];
  return {
    project,
    modules: modules
      .filter((module) => module && typeof module === "object")
      .map((module) => ({
        name: MODULES.has(module.name) ? module.name : "其他",
        tasks: Array.isArray(module.tasks) ? module.tasks
          .filter((task) => task && typeof task === "object" && String(task.title || "").trim())
          .map((task) => ({
            title: String(task.title).trim(),
            detail: String(task.detail || "").trim(),
            owner: String(task.owner || "").trim(),
            deadline: String(task.deadline || "").trim(),
            related_object: String(task.related_object || "").trim(),
            notes: String(task.notes || "").trim(),
            priority: String(task.priority || "").trim(),
            status: "todo"
          })) : []
      }))
      .filter((module) => module.tasks.length > 0)
  };
}

export function toAppleNotesMarkdown(result) {
  const lines = [`# ${result.project}执行清单`, ""];
  for (const module of result.modules) {
    lines.push(`## ${module.name}`, "");
    for (const task of module.tasks) {
      lines.push(`☐ ${task.title}`, "", "说明：", `- ${task.detail || ""}`);
      lines.push("", "负责人：", `- ${task.owner || ""}`);
      lines.push("", "Deadline：", `- ${task.deadline || ""}`);
      lines.push("", "涉及对象：", `- ${task.related_object || ""}`);
      if (task.notes) lines.push("", "备注：", `- ${task.notes}`);
      lines.push("");
    }
  }
  return lines.join("\n").trim();
}

export function extractJson(text) {
  const cleaned = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  throw new Error("模型没有返回合法 JSON");
}
