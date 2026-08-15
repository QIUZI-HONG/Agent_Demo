'use strict';
/* ============================================================
   TubeInsight 后端（Node/Express）
   - 业务逻辑在 core.js（HTTP 与 MCP 共用）
   - API：/api/analyze、/api/ingest、/api/ask、/api/config、/api/health
   - 生产模式：托管 web/dist 静态前端
   ============================================================ */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { config, persistConfig, analyzeChannel, ingestChannel, answerQuestion, testConnections, llmChat, llmJSON } = require('./core');
const { analyzeKeyword, dashboardData, generateScript, generateImagePrompts } = require('./ecommerce-data');

const app = express();
/* CORS 白名单：仅同源 + Vite 开发端口（上线防第三方网站调用刷 LLM） */
const ALLOWED_ORIGINS = [
  'http://localhost:3000', 'http://127.0.0.1:3000',
  'http://localhost:5173', 'http://127.0.0.1:5173'
];
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '1mb' }));

/* 请求体解析错误 → JSON（不泄露 HTML/堆栈） */
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: '无效的 JSON 请求体' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: '请求体过大（上限 1MB）' });
  next(err);
});

/* ==================== API 路由 ==================== */
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.get('/api/config', (req, res) => res.json({ hasYt: !!config.ytKey, hasLlm: !!config.llmKey }));

app.post('/api/config', (req, res) => {
  if (typeof req.body.ytKey === 'string' && req.body.ytKey.trim()) config.ytKey = req.body.ytKey.trim();
  if (typeof req.body.llmKey === 'string' && req.body.llmKey.trim()) config.llmKey = req.body.llmKey.trim();
  persistConfig();
  res.json({ ok: true, hasYt: !!config.ytKey, hasLlm: !!config.llmKey });
});

app.post('/api/analyze', async (req, res) => {
  try {
    const name = String(req.body && req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name required' });
    res.json(await analyzeChannel(name));
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});

app.post('/api/ingest', async (req, res) => {
  try {
    const name = String(req.body && req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name required' });
    res.json(await ingestChannel(name));
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});

app.post('/api/ask', async (req, res) => {
  try {
    const name = String(req.body && req.body.name || '').trim();
    const question = String(req.body && req.body.question || '').trim();
    if (!name || !question) return res.status(400).json({ error: 'name & question required' });
    res.json(await answerQuestion(name, question));
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});

app.post('/api/test-connection', async (req, res) => {
  try {
    res.json(await testConnections());
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});

/* ==================== 跨境电商 ====================
   已配置 LLM Key → 真实大模型生成（source: llm）
   未配置 → 回退演示模板（source: demo）
   数据看板 → 支持导入用户自己的真实数据（CSV） */

/* ① 选品分析：真实 LLM */
app.post('/api/ecom/analyze', async (req, res) => {
  try {
    const keyword = String(req.body && req.body.keyword || '').trim();
    if (!keyword) return res.status(400).json({ error: 'keyword required' });
    const report = await llmJSON(
      '你是跨境电商选品分析专家，专注东南亚市场（TikTok Shop / Shopee / Lazada）。只输出 JSON，不要任何其他文字。JSON 格式：{"summary":"一句话市场判断","opportunities":["机会1","机会2","机会3"],"risks":["风险1","风险2"],"pricing":"建议定价区间及理由","platforms":[{"name":"TikTok Shop","strategy":"打法"}],"keywords":["关联关键词1","关键词2"]}',
      '请分析品类「' + keyword + '」在东南亚市场的选品机会。'
    );
    if (report) return res.json({ keyword, source: 'llm', report });
    res.json({ keyword, source: 'demo', ...analyzeKeyword(keyword) });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});

app.get('/api/ecom/dashboard', (req, res) => res.json({ ...dashboardData(), source: 'demo' }));

/* ② 数据看板：导入用户真实数据（CSV）→ 真实统计 + LLM 洞察 */
function parseCsv(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];
  for (const line of lines) {
    const parts = line.split(/[,，\t]/).map((p) => p.trim());
    if (parts.length < 2) continue;
    const label = parts[0];
    const n1 = parseFloat(parts[1]);
    const n2 = parts.length > 2 ? parseFloat(parts[2]) : NaN;
    if (label && !isNaN(n1)) rows.push({ label, n1, n2: isNaN(n2) ? null : n2 });
  }
  return rows;
}

app.post('/api/ecom/data', async (req, res) => {
  try {
    const text = String(req.body && req.body.data || '').trim();
    if (!text) return res.status(400).json({ error: 'data required（格式：日期,订单数,流量）' });
    const rows = parseCsv(text);
    if (rows.length < 2) return res.status(400).json({ error: '数据太少，至少两行（示例：1月1日,86,3200）' });
    const first = rows[0].n1, last = rows[rows.length - 1].n1;
    const stats = {
      days: rows.length,
      totalOrders: rows.reduce((a, r) => a + r.n1, 0),
      avgOrders: Math.round(rows.reduce((a, r) => a + r.n1, 0) / rows.length),
      peak: { label: rows.reduce((a, r) => (r.n1 > a.n1 ? r : a)).label, value: rows.reduce((a, r) => (r.n1 > a.n1 ? r : a)).n1 },
      trend: first ? Math.round(((last - first) / first) * 100) : 0
    };
    let summary = null;
    if (config.llmKey) {
      summary = await llmChat(
        '你是跨境电商数据分析师。基于给出的真实数据，输出 3 条简短洞察，每条用「- 」开头，不超过 40 字，只讲数据里能看到的事实。',
        '数据统计：' + JSON.stringify(stats) + '\n每日订单序列：' + rows.map((r) => r.label + ':' + r.n1).join(', ')
      );
      summary = summary ? summary.split('\n').map((s) => s.replace(/^-\s*/, '').trim()).filter(Boolean).slice(0, 3) : null;
    }
    res.json({ source: 'real', stats, series: rows, summary });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});

/* ③ 短视频脚本：真实 LLM */
app.post('/api/ecom/script', async (req, res) => {
  try {
    const product = String(req.body && req.body.product || '').trim();
    if (!product) return res.status(400).json({ error: 'product required' });
    const r = await llmJSON(
      '你是跨境电商短视频脚本专家，为 TikTok Shop / Shopee 带货视频写脚本。只输出 JSON，不要其他文字。JSON 格式：{"hook":"0-3s 钩子，口语化，带痛点","body":["第一幕(0-5s)…","第二幕(5-15s)…","第三幕(15-25s)…"],"cta":"结尾引导下单","titles":["标题1","标题2","标题3"],"caption":"发布文案","hashtags":["#TikTokShop","#爆款"]}',
      '产品是「' + product + '」，请生成完整带货视频脚本。'
    );
    if (r) return res.json({ product, source: 'llm', ...r });
    res.json({ product, source: 'demo', ...generateScript(product) });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});

/* ④ AI 出图 Prompt：真实 LLM */
app.post('/api/ecom/prompts', async (req, res) => {
  try {
    const product = String(req.body && req.body.product || '').trim();
    const style = String(req.body && req.body.style || '').trim();
    if (!product) return res.status(400).json({ error: 'product required' });
    const r = await llmJSON(
      '你是电商视觉设计师，擅长为 AI 绘图工具（Midjourney / 即梦 / 通义万相）写提示词。为东南亚电商（TikTok Shop / Shopee / Lazada）生成 5 类提示词。只输出 JSON，不要其他文字。JSON 格式：{"main":"商品主图提示词","detail":"详情页首屏提示词","scene":"场景图提示词","ad":"广告图提示词","social":"社媒配图提示词"}。提示词用中文，包含产品、风格、构图、光影、东南亚审美要素。',
      '产品：' + product + '；风格：' + (style || '东南亚审美')
    );
    if (r) return res.json({ product, style: style || '东南亚审美', source: 'llm', ...r });
    res.json({ product, style: style || '东南亚审美', source: 'demo', ...generateImagePrompts(product, style || '东南亚审美') });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});

/* ==================== 生产模式：托管 web/dist ==================== */
const dist = path.join(__dirname, '..', 'web', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('/favicon.ico', (req, res) => res.status(204).end());
  /* 未知 API 路径 → 404 JSON（不被 SPA fallback 吞掉） */
  app.use('/api', (req, res) => res.status(404).json({ error: '接口不存在' }));
  /* SPA fallback：仅无扩展名的路径回 index.html，静态资源 404 保持 404 */
  app.get('*', (req, res, next) => {
    if (path.extname(req.path)) return next();
    res.sendFile(path.join(dist, 'index.html'));
  });
  console.log('[static] serving web/dist');
}

/* 统一兜底错误处理：不泄露内部错误细节 */
app.use((err, req, res, next) => {
  console.error('[error]', err && err.message);
  res.status(500).json({ error: '服务器内部错误' });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1'; // 默认仅本机可访问，防外部刷接口
app.listen(PORT, HOST, () => console.log('TubeInsight server: http://localhost:' + PORT));
