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
        name: inferModuleName(module),
        tasks: Array.isArray(module.tasks) ? module.tasks
          .filter((task) => task && typeof task === "object" && String(task.title || "").trim())
          .map((task) => ({
            title: String(task.title).trim(),
            detail: String(task.detail || "").trim(),
            owner: cleanOwner(task.owner),
            deadline: cleanDeadline(task.deadline),
            related_object: String(task.related_object || "").trim(),
            notes: String(task.notes || "").trim(),
            priority: String(task.priority || "").trim(),
            status: "todo"
          })) : []
      }))
      .filter((module) => module.tasks.length > 0)
  };
}

function cleanOwner(value) {
  const owner = String(value || "").trim();
  return /未命名项目|未命名|项目负责人/.test(owner) ? "" : owner;
}

function cleanDeadline(value) {
  const deadline = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(deadline) ? deadline : "";
}

function inferModuleName(module) {
  const name = String(module?.name || "").trim();
  const taskText = (Array.isArray(module?.tasks) ? module.tasks : [])
    .map((task) => `${task?.title || ""} ${task?.detail || ""} ${task?.related_object || ""}`)
    .join(" ");
  if (/酒店|住宿|房间|入住/.test(`${name} ${taskText}`)) return "酒店";
  return MODULES.has(name) ? name : "其他";
}

export function toAppleNotesMarkdown(result) {
  const lines = [];
  for (const module of result.modules) {
    lines.push(module.name);
    for (const task of module.tasks) {
      lines.push(`○ ${task.title}`);
      if (shouldShowDetail(task.title, task.detail)) lines.push(`- ${task.detail}`);
      if (task.owner) lines.push(`- 负责人：${task.owner}`);
      if (task.deadline) lines.push(`- Deadline：${task.deadline}`);
      if (task.related_object) lines.push(`- 涉及对象：${task.related_object}`);
      if (task.notes) lines.push(`- 备注：${task.notes}`);
      lines.push("");
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

function shouldShowDetail(title, detail) {
  const normalizedTitle = String(title || "").replace(/[\s，。；：、,.!?！？]/g, "");
  const normalizedDetail = String(detail || "").replace(/[\s，。；：、,.!?！？]/g, "");
  if (!normalizedDetail || normalizedDetail === normalizedTitle) return false;
  if (normalizedDetail.includes(normalizedTitle) || normalizedTitle.includes(normalizedDetail)) return false;
  return true;
}

export function extractJson(text) {
  const cleaned = String(text || "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  throw new Error("模型没有返回合法 JSON");
}
