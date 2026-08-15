'use strict';
/* ============================================================
   共享业务核心层（server.js 与 mcp-server.js 复用）
   - 分析频道 / RAG 索引 / RAG 问答 / 工作流生成
   - Key 与 API 端点配置
   ============================================================ */
const { makeDemo, ruleConclusion, fmt, toNum } = require('./demo-data');
const vs = require('./vector-store');
const { demoTranscripts, chunkText, fetchRealTranscripts } = require('./transcripts');
const { genWorkflow } = require('./ideas');
const fs = require('fs');
const path = require('path');

/* Key 持久化：保存到 server/data/config.json，重启后自动加载（环境变量优先） */
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');
function loadConfigFile() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch (e) { return {}; }
}
const savedCfg = loadConfigFile();
const config = {
  ytKey: process.env.YT_KEY || savedCfg.ytKey || '',
  llmKey: process.env.LLM_KEY || savedCfg.llmKey || ''
};
function persistConfig() {
  try {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ ytKey: config.ytKey, llmKey: config.llmKey }, null, 2));
  } catch (e) { /* 忽略写入失败 */ }
}

/* API 端点可配置（默认真实服务；测试时可指向本地 mock） */
const API = {
  yt: process.env.YT_API_BASE || 'https://www.googleapis.com/youtube/v3',
  llm: process.env.LLM_API_BASE || 'https://api.deepseek.com',
  llmModel: process.env.LLM_MODEL || 'deepseek-chat',
  transcript: process.env.TRANSCRIPT_BASE || 'https://www.youtube.com'
};

/* ==================== YouTube 真实数据 ==================== */
async function searchChannel(name, key) {
  const sj = await fetch(API.yt + '/search?part=snippet&type=channel&q=' +
    encodeURIComponent(name) + '&maxResults=1&key=' + key);
  const sjd = await sj.json();
  const chId = sjd.items && sjd.items[0] && sjd.items[0].id && sjd.items[0].id.channelId;
  if (!chId) throw new Error('channel not found');
  return chId;
}

async function fetchChannelVideos(chId, key) {
  const vsr = await fetch(API.yt + '/search?part=snippet&type=video&channelId=' + chId +
    '&order=viewCount&maxResults=3&key=' + key);
  const vsd = await vsr.json();
  const ids = (vsd.items || []).map((i) => i.id.videoId).join(',');
  if (!ids) return [];
  const vdr = await fetch(API.yt + '/videos?part=statistics&id=' + ids + '&key=' + key);
  const vdd = await vdr.json();
  return (vdd.items || []).map((v, idx) => ({
    id: v.id,
    title: (vsd.items[idx] && vsd.items[idx].snippet) ? vsd.items[idx].snippet.title : '视频',
    v: fmt(parseInt(v.statistics && v.statistics.viewCount || 0, 10)),
    likes: parseInt(v.statistics && v.statistics.likeCount || 0, 10),
    comments: parseInt(v.statistics && v.statistics.commentCount || 0, 10)
  }));
}

async function fetchRealChannel(name, key) {
  const chId = await searchChannel(name, key);
  const cj = await fetch(API.yt + '/channels?part=snippet,statistics&id=' + chId + '&key=' + key);
  const cjd = await cj.json();
  const item = cjd.items && cjd.items[0];
  if (!item) throw new Error('channel detail not found');
  const s = item.statistics || {};
  const videos = await fetchChannelVideos(chId, key);
  const likes = videos.reduce((a, x) => a + x.likes, 0);
  const comments = videos.reduce((a, x) => a + x.comments, 0);
  const viewSum = videos.reduce((a, x) => a + toNum(x.v), 0);
  const engage = viewSum > 0 ? ((likes + comments) / viewSum * 100).toFixed(1) : '—';
  return {
    name: item.snippet.title,
    handle: (item.snippet.customUrl || '') + ' · ' + (item.snippet.country || '—'),
    subs: fmt(parseInt(s.subscriberCount || 0, 10)),
    views: fmt(parseInt(s.viewCount || 0, 10)),
    views30: '—', engage: engage + '%', trend: '实时',
    videos: videos.map((x) => ({ t: x.title, v: x.v })),
    real: true,
    videoIds: videos.map((x) => ({ id: x.id, title: x.title }))
  };
}

/* ==================== LLM ==================== */
async function llmChat(sys, user) {
  if (!config.llmKey) return null;
  const r = await fetch(API.llm + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.llmKey },
    body: JSON.stringify({
      model: API.llmModel,
      messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
      temperature: 0.6
    })
  });
  if (!r.ok) return null;
  const j = await r.json();
  const text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  return text || null;
}

/* ==================== 分析频道 ==================== */
async function analyzeChannel(name) {
  if (!name) throw new Error('name required');
  let data = null, real = false, note = '';
  if (config.ytKey) {
    try {
      data = await fetchRealChannel(name, config.ytKey);
      real = !!data;
      if (!data) note = '（未找到该频道，回退演示数据）';
    } catch (e) { note = '（真实 API 调用失败，回退演示数据）'; }
  }
  if (!data) data = makeDemo(name);
  let concl = null;
  if (config.llmKey) {
    try {
      const text = await llmChat(
        '你是海外 YouTube 内容分析师。请用中文输出 3 条简洁分析结论，每条用「- 」开头，不超过 45 字，不要多余解释。',
        '频道数据：' + JSON.stringify(data)
      );
      concl = text ? text.split('\n').map((s) => s.replace(/^-\s*/, '').trim()).filter(Boolean).slice(0, 3) : null;
    } catch (e) { concl = null; }
  }
  return { data, real, concl: concl || ruleConclusion(data), note };
}

/* ==================== RAG：索引频道字幕 ==================== */
async function ingestChannel(name) {
  let data = makeDemo(name);
  let source = 'demo';
  let transcripts = [];
  if (config.ytKey) {
    try {
      const real = await fetchRealChannel(name, config.ytKey);
      if (real) { data = real; source = 'real'; }
    } catch (e) { /* 回退演示 */ }
  }
  if (source === 'real' && data.videoIds && data.videoIds.length) {
    try {
      const t = await fetchRealTranscripts(data.videoIds, API.transcript);
      if (t.length) transcripts = t;
    } catch (e) { /* 回退演示 */ }
  }
  if (!transcripts.length) transcripts = demoTranscripts(data.name, data.videos);
  const items = [];
  for (const t of transcripts) {
    for (const c of chunkText(t.text)) {
      items.push({ video: t.video, time: c.time, text: c.text });
    }
  }
  const db = vs.load();
  vs.upsertChannel(db, data.name, items);
  vs.save(db);
  return { ok: true, channel: data.name, chunks: items.length, videos: transcripts.length, source };
}

/* ==================== RAG：问答 ==================== */
function composeAnswer(q, hits, llmText) {
  const sources = hits.map((h) => ({ video: h.video, time: h.time, text: h.text, score: Math.round(h.score * 100) }));
  if (llmText) return { answer: llmText, sources };
  if (!hits.length) return { answer: '内容库里暂时没有相关内容，换个问法试试，或先索引字幕。', sources };
  const top = hits[0];
  if (hits.length >= 2) {
    return {
      answer: '根据字幕片段：' + top.text + '（《' + top.video + '》 ' + top.time + '）。补充：' + hits[1].text + '（《' + hits[1].video + '》 ' + hits[1].time + '）。',
      sources
    };
  }
  return { answer: '根据字幕片段：' + top.text + '（《' + top.video + '》 ' + top.time + '）。', sources };
}

async function answerQuestion(name, question) {
  const db = vs.load();
  const hits = vs.search(db, question, name, 3);
  let llmText = null;
  if (hits.length && config.llmKey) {
    try {
      const ctx = hits.map((h, i) => '[' + (i + 1) + '] 视频《' + h.video + '》 ' + h.time + '：' + h.text).join('\n');
      llmText = await llmChat(
        '你是 YouTube 视频内容分析助手。只根据提供的字幕片段回答用户问题，若片段不足以回答就如实说明。用中文，简洁，不要编造片段外的信息。',
        '问题：' + question + '\n\n字幕片段：\n' + ctx
      );
    } catch (e) { llmText = null; }
  }
  const composed = composeAnswer(question, hits, llmText);
  return { answer: composed.answer, sources: composed.sources, ingested: true };
}

/* ==================== 工作流（内容军师） ==================== */
function generateIdeas(channel, topic, goal) {
  return genWorkflow(channel || 'MrBeast', topic || 'AI 工具测评', goal || '涨粉');
}

/* ==================== LLM 结构化 JSON（失败返回 null） ==================== */
async function llmJSON(sys, user) {
  const text = await llmChat(sys, user);
  if (!text) return null;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (e) { return null; }
}

/* ==================== 连接测试（验证 Key 是否有效） ==================== */
async function testConnections() {
  const out = {};
  if (config.ytKey) {
    try {
      const r = await fetch(API.yt + '/videos?part=snippet&id=dQw4w9WgXcQ&key=' + config.ytKey);
      const j = await r.json();
      out.yt = r.ok && !j.error ? 'ok' : 'invalid';
    } catch (e) { out.yt = 'error'; }
  } else out.yt = 'not-configured';
  if (config.llmKey) {
    try {
      const r = await fetch(API.llm + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + config.llmKey },
        body: JSON.stringify({ model: API.llmModel, messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 })
      });
      out.llm = r.ok ? 'ok' : 'invalid';
    } catch (e) { out.llm = 'error'; }
  } else out.llm = 'not-configured';
  return out;
}

module.exports = { config, persistConfig, API, analyzeChannel, ingestChannel, answerQuestion, generateIdeas, testConnections, llmChat, llmJSON };
