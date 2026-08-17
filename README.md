# TubeInsight · 真实项目骨架（React + Node）

> 🚀 **在线 Demo（GitHub Pages，内置演示数据，打开即玩）**
> 👉 **https://qiuzi-hong.github.io/Agent_Demo/**
>
> 无需安装、无需 Key，浏览器直接体验：频道分析 / Agent 对话 / RAG 视频问答 / 内容军师 / 跨境电商 AI 工具。
> 完整功能（接真实 YouTube / LLM 数据）请按下方说明本地运行。

前后端分离的真实项目结构。默认用演示数据跑通流程；配置 Key 后自动接真实 YouTube / LLM 数据。

## 目录结构
```
D:\Test02\
├── start.bat          一键启动（双击即可，自动打开浏览器）
├── server/            Node 后端（Express）
│   ├── server.js      入口：/api/analyze、/api/config、/api/health；生产模式托管 web/dist
│   ├── demo-data.js   演示数据 + 生成器 + 规则结论（无 Key 兜底）
│   └── package.json
├── web/               React 前端（Vite）
│   ├── src/App.jsx    5 个页面（工作台/对话/频道/工作流/设置）+ 全部逻辑
│   ├── src/styles.css 设计系统（暗/亮双主题）
│   └── src/api.js     后端接口封装
└── app/               离线单文件版（旧版，双击 index.html 可用）
```

## 快速启动（一键）
双击 **`start.bat`** → 自动打开 http://localhost:3000
（关闭黑窗口即停止服务）

## 开发模式（改代码热更新）
```bash
# 终端 1：后端
cd server && npm start        # http://localhost:3000

# 终端 2：前端（改代码自动刷新）
cd web && npm run dev         # http://localhost:5173
```

## 重新构建前端（改完 web/ 后让后端托管新页面）
```bash
cd web && npm run build
```

## API 一览
| 接口 | 说明 |
|---|---|
| `GET /api/health` | 健康检查 |
| `GET /api/config` | 是否已配置 Key |
| `POST /api/config` | 保存 YT / LLM Key（空值不覆盖） |
| `POST /api/analyze` `{name}` | 分析频道 → `{data, real, concl, note}` |
| `POST /api/ingest` `{name}` | 索引频道字幕 → 分块 → 向量化（RAG） |
| `POST /api/ask` `{name, question}` | 问视频内容 → `{answer, sources}`（带引用） |

## RAG（问视频内容）
- **流程**：字幕（演示内置 / 真实抓取）→ 分块（240 字 + 重叠）→ 哈希特征向量（零依赖）→ 余弦相似度 Top-K → 回答 + 引用来源
- **演示字幕可回答问题**：如 MrBeast「视频里送了几辆车？」→ 100 辆（5 辆特斯拉）
- **真实字幕**：配置 YT Key 后自动尝试抓取视频字幕；抓不到自动回退演示
- **LLM 增强**：配置 LLM Key 后，回答由大模型基于检索片段生成（更自然、不编造）
- 存储：`server/data/vector-store.json`（本地 JSON 文件，可随时删除重建）

## 跨境电商模块（真实 AI 工具，LLM Key 驱动）
侧边栏 **「跨境电商」** 页面，配置 LLM Key 后全部由**真实大模型生成**（绿色「真实 AI」标）；未配置自动回退演示模板（黄色「演示」标）。
| Tab | 功能 | 真实化方式 |
|---|---|---|
| 🔍 选品分析 | 输入品类 → 真实 LLM 生成完整报告（市场判断/机会/风险/定价/平台打法/关键词） | LLM |
| 📊 数据看板 | **粘贴你自己的订单/流量 CSV** → 真实统计图表 + LLM 洞察 | 真实数据 + LLM |
| 🎬 短视频脚本 | 真实 LLM 生成脚本（钩子/三幕/CTA/标题/文案/标签） | LLM |
| 🖼 AI 出图 Prompt | 真实 LLM 生成 5 类出图提示词（东南亚审美 + 三平台规范） | LLM |

> 说明：TikTok Shop / Shopee / Lazada 官方 API 需企业卖家资质，个人不可申请；因此数据看板走"导入平台后台导出的 CSV"路线（`/api/ecom/data`）。

接口：`/api/ecom/analyze`、`/api/ecom/dashboard`、`/api/ecom/data`、`/api/ecom/script`、`/api/ecom/prompts`。

## MCP（标准 Model Context Protocol）
把分析能力封装成**标准 MCP Server**（stdio 协议），可接入 Claude Desktop / Cursor / 任意 MCP 客户端。

**启动**：`node server/mcp-server.js`
**暴露的工具**：
| 工具 | 参数 | 说明 |
|---|---|---|
| `analyze_channel` | `name` | 分析频道 → 数据 + 结论 |
| `ask_video_content` | `channel, question` | RAG 问视频内容（自动索引 + 带来源） |
| `generate_ideas` | `channel?, topic?, goal?` | 内容军师：选题 / 标题 / 发布建议 |

**接入 Claude Desktop**：把设置页复制到的配置放进 `claude_desktop_config.json` 的 `mcpServers`。
**自测**：`node test/mcp-client-test.js`（裸 JSON-RPC 驱动完整 initialize → tools/list → tools/call 流程）。

## 如何验证"接上真实 API 没问题"（本地 mock 测试）
项目内置一套**模拟真实 Google / DeepSeek API 的假服务器**，用来验证真实代码路径，无需真实 Key：

```bash
# 终端 1：启动模拟 API（端口 3999）
cd server && node test/mock-apis.js

# 终端 2：后端指向 mock（另开终端）
cd server
$env:YT_API_BASE='http://localhost:3999/youtube/v3'
$env:LLM_API_BASE='http://localhost:3999'
$env:TRANSCRIPT_BASE='http://localhost:3999'
node server.js

# 然后配置"假 Key"并在设置页分析 MockTube：
curl -X POST http://localhost:3000/api/config -H "Content-Type: application/json" -d '{"ytKey":"fake-key","llmKey":"fake-key"}'
```
Mock 会模拟：YouTube 频道/视频/统计、视频字幕（timedtext）、LLM 结论；`bad-key` 触发 403/401 用于测试**失败自动回退演示数据**。
已实测通过：真实频道数据、真实字幕索引、RAG-LLM 问答、坏 Key 回退。

## 接真实数据
设置页填写（或后端启动前设置环境变量 `YT_KEY` / `LLM_KEY`）：
- **YouTube Data API Key**：https://console.cloud.google.com 启用 YouTube Data API v3 后创建
- **LLM Key**（可选）：DeepSeek 等 OpenAI 兼容平台 key

无 Key / Key 无效 / 网络失败 → 自动回退演示数据并提示，流程不断。

## 当前技术栈（对应 JD 要求）
- 后端：**Node.js + Express**（JS 满足 JD「熟悉 Python/Go/JS/TS 至少一种」；如面试更想要 Python，可换 FastAPI，接口保持不变）
- 前端：**React + Vite**（加分项点名 React）
- 后续里程碑：MCP Server、更多 YouTube 接口、部署上线
