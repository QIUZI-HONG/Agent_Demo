'use strict';
/* ============================================================
   字幕数据：演示字幕（可回答问题）+ 真实字幕抓取 + 分块
   ============================================================ */
const { hashStr } = require('./vector-store');

/* 演示字幕（内置，内容可被问）：按频道小写名索引 */
const DEMO_TRANSCRIPTS = {
  'mrbeast': [
    {
      video: '我送给粉丝 100 辆车…',
      text: '今天我们要送出 100 辆车，其中 5 辆是特斯拉 Model 3，其余 95 辆是经济型家用车，所有车都来自我们的赞助商。我们准备了 1000 个信封，每个信封里有一把车钥匙，只有 100 个信封真的有车。粉丝需要在 60 秒内打开信封并扫描二维码登记。最终我们成功送出了全部 100 辆车，花费总额约 300 万美元。'
    },
    {
      video: '花 100 万美元给流浪汉买房子',
      text: '这一期我们花了 100 万美元，为 20 位流浪汉购买了房子，平均每栋房子 5 万美元。我们带着房产中介和搬家团队，帮他们完成签约、家具采购和搬家。其中有一位名叫 Michael 的先生，他已经在街头生活了 8 年，收到钥匙的时候哭了。我们希望这个系列能持续做下去。'
    },
    {
      video: '挑战 24 小时不眨眼',
      text: '我们挑战 24 小时不眨眼，这是有史以来最难的挑战之一。我们用胶带和支架固定眼皮，中间还经历了拍摄器材故障。到第 12 小时的时候，团队里已经有人坚持不住退出了。最终只有我和 Jimmy 坚持到了最后，我们赢得了 10 万美元奖金。'
    }
  ],
  'techtok': [
    {
      video: '2025 年最值得买的 10 款手机',
      text: '本期榜单第一名是 iPhone 17 Pro，电池续航提升了 30%，摄像头升级到了 5 倍长焦。第二名是三星 S26 Ultra，屏幕亮度最高。性价比之选是小米 15，起售价 3999 元。预算有限的话推荐红米 Note 14。所有手机我们都实测了 7 天，数据都来自真实使用。'
    },
    {
      video: '这个 AI 工具让我效率翻倍',
      text: '我用了 Cursor 和 Claude Code 各一周，发现写代码效率提升了两倍。具体做法是：先写需求文档，再让 AI 生成骨架，最后人工审查关键逻辑。我统计了一下，一周内完成了 21 个功能点，而以前只能完成 8 个。建议新人从小的工具脚本开始练手。'
    },
    {
      video: '苹果新品发布会速评',
      text: '苹果刚刚发布了新一代 MacBook Pro，搭载 M5 芯片，性能比上一代提升 40%。发布会上还推出了新的 iPad Air 和 AirPods Pro 3。我个人最惊喜的是 MacBook 的续航，实测达到 22 小时。价格方面，MacBook Pro 起售价 14999 元。'
    }
  ],
  'codedaily': [
    {
      video: '我用 Claude Code 从 0 到 1 写了个产品',
      text: '我用 Claude Code 用了 3 天时间，从需求分析到上线完成了第一个产品。流程是：第一天写需求文档和架构设计，第二天让 AI 生成全部代码并做代码审查，第三天部署上线。期间我修复了 AI 生成的 7 个 bug，包括一个 N+1 查询和一个内存泄漏。'
    },
    {
      video: 'Git 高级技巧 30 讲',
      text: '第一讲：git rebase 和 merge 的区别。rebase 会让提交历史变成一条直线，适合个人分支；merge 保留合并记录，适合多人协作。第二讲：如何用 git stash 临时保存工作区。第三讲：cherry-pick 精选提交。我们用一个实际仓库演示了全部操作。'
    },
    {
      video: '新人必看的代码审查指南',
      text: '代码审查最重要的是先看整体逻辑，再看命名和细节。第一原则：功能正确性优先。第二原则：小提交容易审查。第三原则：评论要具体。我们团队每周五做一次集中审查，bug 率下降了 30%。'
    }
  ]
};

/* 未知频道的通用演示字幕（确定性生成） */
function genericTranscript(name, videoTitle, seed) {
  const openers = ['大家好，欢迎回到频道。', '这一期我们聊聊', '今天的内容很干，建议收藏。', ''];
  const mids = ['首先给大家分享一个实用技巧：', '很多新人都会忽略这一点：', '我们实测了一下：'];
  const closers = ['最后记得三连支持一下。', '有问题欢迎在评论区提问。', '我们下期再见。'];
  const topics = ['选题方法', '工具推荐', '踩坑记录', '数据复盘', '入门路线'];
  const topic = topics[seed % topics.length];
  return [
    openers[seed % openers.length],
    '这一期讲「' + topic + '」，结合频道「' + name + '」的实际经验，对应视频《' + videoTitle + '》。',
    mids[seed % mids.length] + '关键要点是：先定目标，再拆步骤，最后复盘数据。',
    '我们一共测试了 ' + (10 + seed % 40) + ' 次，发现稳定的做法是保持每周更新 ' + (1 + seed % 3) + ' 期。',
    '互动方面，在结尾提问能显著提升评论量，平均提升 ' + (10 + seed % 30) + '%。',
    closers[seed % closers.length]
  ].join('');
}

/* 根据频道名 + 视频列表生成演示字幕 */
function demoTranscripts(name, videos) {
  const k = name.trim().toLowerCase();
  if (DEMO_TRANSCRIPTS[k]) {
    return DEMO_TRANSCRIPTS[k].map((t, i) => ({
      video: videos[i] ? videos[i].t : t.video,
      text: t.text
    }));
  }
  const h = hashStr(name.trim().toLowerCase());
  return (videos || []).map((v, i) => ({
    video: v.t,
    text: genericTranscript(name, v.t, h + i * 7)
  }));
}

/* ---------- 分块（带演示时间轴） ---------- */
function ts(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
function chunkText(text, size = 240, overlap = 40) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  const out = [];
  let i = 0, sec = 0;
  while (i < clean.length) {
    out.push({ time: ts(sec), text: clean.slice(i, i + size) });
    sec += size * 0.12; // 演示时间轴（真实字幕会带真实时间戳）
    i += size - overlap;
  }
  return out;
}

/* ---------- 真实字幕抓取（best-effort，失败返回空） ---------- */
async function fetchRealTranscript(videoId, base) {
  const page = await fetch((base || 'https://www.youtube.com') + '/watch?v=' + videoId, {
    headers: { 'Accept-Language': 'en-US', 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await page.text();
  const idx = html.indexOf('ytInitialPlayerResponse');
  if (idx < 0) return null;
  const seg = html.slice(idx);
  const objStart = seg.indexOf('{');
  let depth = 0, end = -1;
  for (let i = objStart; i < seg.length; i++) {
    if (seg[i] === '{') depth++;
    else if (seg[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) return null;
  const data = JSON.parse(seg.slice(objStart, end + 1));
  const tracks = (data.captions && data.captions.playerCaptionTracklistRenderer && data.captions.playerCaptionTracklistRenderer.captionTracks) || [];
  if (!tracks.length) return null;
  const r = await fetch(tracks[0].baseUrl + '&fmt=json');
  const j = await r.json();
  const parts = [];
  for (const ev of (j.events || [])) {
    if (ev.segs) {
      const t = ev.segs.map((s) => s.utf8 || '').join('').trim();
      if (t) parts.push(t);
    }
  }
  return parts.join(' ').trim() || null;
}

/* videos: [{id, title}] -> [{video, text}]（最多前 3 条，失败的跳过） */
async function fetchRealTranscripts(videos, base) {
  const out = [];
  for (const v of (videos || []).slice(0, 3)) {
    try {
      const text = await fetchRealTranscript(v.id, base);
      if (text && text.length > 50) out.push({ video: v.title, text });
    } catch (e) { /* 跳过 */ }
  }
  return out;
}

module.exports = { DEMO_TRANSCRIPTS, demoTranscripts, genericTranscript, chunkText, ts, fetchRealTranscript, fetchRealTranscripts };
