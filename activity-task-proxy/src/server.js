import http from "node:http";
import { TASK_PROMPT } from "./prompt.js";
import { extractJson, normalizeResult, toAppleNotesMarkdown } from "./format.js";

const port = Number(process.env.PORT || 8787);
const maxBodyBytes = Number(process.env.MAX_BODY_BYTES || 32 * 1024 * 1024);
const model = process.env.QWEN_MODEL || "qwen-audio-turbo-latest";

function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) throw Object.assign(new Error("音频文件过大"), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw Object.assign(new Error("请求不是合法 JSON"), { status: 400 }); }
}

async function processAudio(input) {
  if (!process.env.DASHSCOPE_API_KEY) throw Object.assign(new Error("服务端未配置 DASHSCOPE_API_KEY"), { status: 500 });
  if (!input.audio_base64 || typeof input.audio_base64 !== "string") {
    throw Object.assign(new Error("缺少 audio_base64"), { status: 400 });
  }
  const mime = typeof input.mime_type === "string" ? input.mime_type : "audio/mp4";
  const audio = `data:;base64,${input.audio_base64.replace(/^data:[^,]+,/, "")}`;
  const currentDate = typeof input.current_date === "string" ? input.current_date : new Date().toISOString().slice(0, 10);
  const qwenResponse = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.DASHSCOPE_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      input: { messages: [{ role: "system", content: [{ text: TASK_PROMPT }] }, { role: "user", content: [{ audio }, { text: `当前日期：${currentDate}\n音频 MIME 类型：${mime}` }] }] }
    })
  });
  const payload = await qwenResponse.json();
  if (!qwenResponse.ok) throw Object.assign(new Error(payload?.message || "通义千问调用失败"), { status: 502 });
  const text = payload?.output?.choices?.[0]?.message?.content?.find((item) => item.text)?.text;
  const result = normalizeResult(extractJson(text));
  return { ...result, markdown: toAppleNotesMarkdown(result), request_id: payload.request_id || "" };
}

const server = http.createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") return send(response, 200, { ok: true });
  if (request.method !== "POST" || request.url !== "/v1/process-audio") return send(response, 404, { error: "not_found" });
  if (process.env.SHORTCUT_TOKEN && request.headers["x-shortcut-token"] !== process.env.SHORTCUT_TOKEN) {
    return send(response, 401, { error: "unauthorized" });
  }
  try { return send(response, 200, await processAudio(await readJson(request))); }
  catch (error) { return send(response, error.status || 500, { error: error.message || "处理失败", retryable: (error.status || 500) >= 500 || error.status === 413 }); }
});

server.listen(port, "0.0.0.0", () => console.log(`activity-task-proxy listening on ${port}`));
