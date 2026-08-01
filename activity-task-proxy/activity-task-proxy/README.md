# 活动执行记录 AI 中转接口

这是给 iPhone 快捷指令使用的无数据库 Node.js 服务。快捷指令上传 Base64 音频；服务端保管 `DASHSCOPE_API_KEY`，调用通义千问 Audio，并返回结构化任务 JSON 与 Apple 备忘录 Markdown。

## 本地运行

需要 Node.js 20+：

```sh
export DASHSCOPE_API_KEY='你的百炼API Key'
export SHORTCUT_TOKEN='给快捷指令使用的随机长字符串'
npm start
```

健康检查：`GET http://localhost:8787/health`

接口：`POST /v1/process-audio`

请求头：`X-Shortcut-Token: ...`

请求体：

```json
{
  "audio_base64": "快捷指令中的Base64音频",
  "mime_type": "audio/mp4",
  "current_date": "2026-08-02"
}
```

返回字段：

- `project`
- `modules[].tasks[]`
- `markdown`
- `request_id`

## 快捷指令对应动作

1. `录制音频`
2. `存储文件`到 `iCloud Drive/快捷指令/活动执行录音/`（必须先执行）
3. `Base64 编码`录音
4. `字典`：`audio_base64` = Base64结果，`mime_type` = `audio/mp4`，`current_date` = 当前日期（`yyyy-MM-dd`）
5. `获取 URL 内容`
   - URL：部署后的 `/v1/process-audio`
   - 方法：POST
   - 请求头：`X-Shortcut-Token`
   - 请求体：JSON
6. 从响应中取得 `markdown`
7. `新建备忘录`
   - 标题：`项目名执行清单_日期`
   - 正文：`markdown`

8. AI 成功后，用响应中的 `project` 和日期重命名第 2 步保存的文件：
   `项目名_执行记录_yyyyMMdd.m4a`

   AI 失败时不要执行重命名，保留原来的 `活动执行记录_yyyyMMdd.m4a`。

如果第 5 步失败，快捷指令只显示“录音已保存，请稍后重新处理”，不要删除已保存的音频。

## 安全边界

- 不要把 `DASHSCOPE_API_KEY` 放进快捷指令。
- 必须使用 HTTPS 部署地址。
- `SHORTCUT_TOKEN` 用于防止接口被公开滥用。
- 服务不保存音频、不建数据库；音频只在当前请求内转发给通义千问。

## 测试

```sh
npm test
```
