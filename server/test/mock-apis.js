'use strict';
/* ============================================================
   模拟真实第三方 API（用于验证"接上真实 API 后代码路径是否正常"）
   - YouTube Data API v3（search / channels / videos）
   - YouTube 网页（ytInitialPlayerResponse 字幕轨）
   - timedtext 字幕 JSON
   - DeepSeek 兼容的 /chat/completions
   - 坏 Key 模拟：key=bad-key 时返回 403/401，测试失败回退
   运行：node test/mock-apis.js   （监听 3999）
   ============================================================ */
const express = require('express');
const app = express();
app.use(express.json());

const CH_ID = 'UCmocktest123456';
const VIDEOS = [
  { id: 'VM1', title: 'MockTube 实测：送 50 辆自行车' },
  { id: 'VM2', title: 'MockTube 的 100 天挑战' },
  { id: 'VM3', title: 'MockTube 工具测评合集' }
];

function ytError(res, code, msg) {
  return res.status(code).json({ error: { code, message: msg } });
}

/* ---------- YouTube Data API v3 ---------- */
app.get('/youtube/v3/search', (req, res) => {
  const key = req.query.key || '';
  if (key === 'bad-key') return ytError(res, 403, 'The provided API key is invalid.');
  if (req.query.type === 'channel') {
    return res.json({ items: [{ id: { channelId: CH_ID }, snippet: { title: 'MockTube', customUrl: '@MockTube', country: 'US' } }] });
  }
  if (req.query.type === 'video') {
    return res.json({ items: VIDEOS.map((v) => ({ id: { videoId: v.id }, snippet: { title: v.title } })) });
  }
  return res.json({ items: [] });
});

app.get('/youtube/v3/channels', (req, res) => {
  const key = req.query.key || '';
  if (key === 'bad-key') return ytError(res, 403, 'The provided API key is invalid.');
  return res.json({ items: [{
    snippet: { title: 'MockTube', customUrl: '@MockTube', country: 'US' },
    statistics: { subscriberCount: '1500000', viewCount: '98000000', videoCount: '120' }
  }] });
});

app.get('/youtube/v3/videos', (req, res) => {
  const key = req.query.key || '';
  if (key === 'bad-key') return ytError(res, 403, 'The provided API key is invalid.');
  const stats = [
    { viewCount: '2100000', likeCount: '180000', commentCount: '12000' },
    { viewCount: '1500000', likeCount: '120000', commentCount: '9000' },
    { viewCount: '980000', likeCount: '76000', commentCount: '5400' }
  ];
  return res.json({ items: VIDEOS.map((v, i) => ({ id: v.id, statistics: stats[i] })) });
});

/* ---------- YouTube 网页（内嵌 ytInitialPlayerResponse） ---------- */
app.get('/watch', (req, res) => {
  const vid = req.query.v || 'VM1';
  const base = 'http://localhost:3999';
  const payload = {
    captions: {
      playerCaptionTracklistRenderer: {
        captionTracks: [{ baseUrl: base + '/timedtext?lang=en&v=' + vid + '&sig=abc123' }]
      }
    }
  };
  res.type('html').send(
    '<html><script>var ytInitialPlayerResponse = ' + JSON.stringify(payload) + ';</script></html>'
  );
});

/* ---------- timedtext 字幕 ---------- */
app.get('/timedtext', (req, res) => {
  const v = req.query.v || 'VM1';
  const texts = {
    VM1: '欢迎来到 MockTube。今天我们实测送礼物活动，一共送出了 50 辆自行车，其中 5 辆是电动自行车。整个活动花费了 8 万元人民币，粉丝需要完成任务才能参与抽奖。',
    VM2: '这是 MockTube 的 100 天挑战系列第 1 天。我们的目标是连续 100 天每天更新一条视频，今天开始第一天，测试频道增长速度。',
    VM3: '本期测评三款免费工具：第一款适合做笔记，第二款适合做自动化，第三款适合做数据分析。我们分别测试了 7 天，给出了完整对比。'
  };
  const segs = (texts[v] || texts.VM1).split('。').filter(Boolean).map((s) => ({ utf8: s + '。' }));
  res.json({ events: [{ tStartMs: 0, segs }] });
});

/* ---------- DeepSeek 兼容 /chat/completions ---------- */
app.post('/chat/completions', (req, res) => {
  const auth = req.headers.authorization || '';
  if (auth === 'Bearer bad-key') return res.status(401).json({ error: { message: 'Authentication Fails' } });
  const sys = (req.body.messages && req.body.messages[0] && req.body.messages[0].content) || '';
  const user = (req.body.messages && req.body.messages[1] && req.body.messages[1].content) || '';
  let content;
  if (sys.includes('视频内容分析助手')) {
    /* RAG 场景：根据字幕片段回答（模拟真实 LLM 按上下文作答） */
    if (user.includes('自行车')) content = '根据字幕片段：一共送出了 50 辆自行车，其中 5 辆是电动自行车，整个活动花费 8 万元人民币。';
    else if (user.includes('挑战')) content = '根据字幕片段：这是 100 天挑战系列，目标是连续 100 天每天更新一条视频。';
    else content = '根据字幕片段：本期测评了三款免费工具，分别适合笔记、自动化和数据分析。';
  } else {
    content = [
      '- 订阅 150 万，属于腰部成长型频道，增速健康。',
      '- 互动率 8.5%，高于同类均值，粉丝粘性不错。',
      '- 建议加大系列化内容，并复用高互动选题。'
    ].join('\n');
  }
  return res.json({ choices: [{ message: { role: 'assistant', content } }] });
});

app.listen(3999, () => console.log('Mock APIs running on http://localhost:3999'));
