'use strict';
/* ============================================================
   TubeInsight MCP Server（标准 Model Context Protocol）
   - 协议：stdio（可接入 Claude Desktop / Cursor / 任意 MCP 客户端）
   - 工具：
     1) analyze_channel(name)        分析频道 → 数据 + 结论
     2) ask_video_content(channel, question)  RAG 问视频内容（带来源）
     3) generate_ideas(channel?, topic?, goal?)  内容军师工作流
   - 用法：node mcp-server.js
   - Key：环境变量 YT_KEY / LLM_KEY（或复用 server.js 的 /api/config）
   ============================================================ */
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { analyzeChannel, ingestChannel, answerQuestion, generateIdeas } = require('./core');

const server = new McpServer({ name: 'tubeinsight', version: '0.1.0' });

/* ---------- 工具 1：分析频道 ---------- */
server.tool(
  'analyze_channel',
  { name: z.string().min(1).describe('YouTube 频道名，例如 MrBeast') },
  async ({ name }) => {
    const r = await analyzeChannel(name);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          channel: r.data.name,
          real_data: r.real,
          subs: r.data.subs,
          total_views: r.data.views,
          views_30d: r.data.views30,
          engagement_rate: r.data.engage,
          trend: r.data.trend,
          top_videos: r.data.videos,
          conclusion: r.concl,
          note: r.note || undefined
        }, null, 2)
      }]
    };
  }
);

/* ---------- 工具 2：RAG 问视频内容 ---------- */
server.tool(
  'ask_video_content',
  {
    channel: z.string().min(1).describe('YouTube 频道名'),
    question: z.string().min(1).describe('关于视频内容的问题，例如「视频里送了几辆车？」')
  },
  async ({ channel, question }) => {
    await ingestChannel(channel); // 确保已索引（幂等）
    const r = await answerQuestion(channel, question);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ answer: r.answer, sources: r.sources }, null, 2)
      }]
    };
  }
);

/* ---------- 工具 3：内容军师工作流 ---------- */
server.tool(
  'generate_ideas',
  {
    channel: z.string().optional().describe('频道名，默认 MrBeast'),
    topic: z.string().optional().describe('内容主题，例如 AI 工具测评'),
    goal: z.string().optional().describe('目标：涨粉 / 互动率 / 变现')
  },
  async ({ channel, topic, goal }) => {
    const r = generateIdeas(channel, topic, goal);
    return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
  }
);

/* ---------- 启动（stdio） ---------- */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TubeInsight MCP Server running (stdio)');
}
main().catch((e) => {
  console.error('MCP server error:', e);
  process.exit(1);
});
