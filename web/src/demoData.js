/* ============================================================
   前端内置演示数据（静态部署/后端不可用时自动使用）
   与 server/demo-data.js 逻辑一致（纯函数，无依赖）
   ============================================================ */

export function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; } return h; }
export function fmt(n) {
  if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + ' 亿';
  if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + ' 万';
  return String(Math.round(n));
}
function toNum(str) {
  str = String(str).trim();
  if (str.includes('亿')) return parseFloat(str) * 1e8;
  if (str.includes('万')) return parseFloat(str) * 1e4;
  return parseFloat(str) || 0;
}

/* ---------- 频道演示数据 ---------- */
const DEMO = {
  'mrbeast': {
    name: 'MrBeast', handle: '@MrBeast · 内容创作者 · 美国',
    subs: '2.1 亿', views: '312 亿', views30: '4.2 亿', engage: '6.2%', trend: '+8.4%',
    videos: [
      { t: '我送给粉丝 100 辆车…', v: '8,400 万' },
      { t: '花 100 万美元给流浪汉买房子', v: '6,200 万' },
      { t: '挑战 24 小时不眨眼', v: '5,100 万' }
    ]
  },
  'techtok': {
    name: 'TechTok', handle: '@TechTok · 科技测评 · 美国',
    subs: '1.2 亿', views: '86 亿', views30: '8,900 万', engage: '11.8%', trend: '+15.2%',
    videos: [
      { t: '2025 年最值得买的 10 款手机', v: '1,200 万' },
      { t: '这个 AI 工具让我效率翻倍', v: '980 万' },
      { t: '苹果新品发布会速评', v: '860 万' }
    ]
  },
  'codedaily': {
    name: 'CodeDaily', handle: '@CodeDaily · 程序员成长 · 中国',
    subs: '42 万', views: '8,500 万', views30: '380 万', engage: '9.3%', trend: '+12.1%',
    videos: [
      { t: '我用 Claude Code 从 0 到 1 写了个产品', v: '45 万' },
      { t: 'Git 高级技巧 30 讲', v: '38 万' },
      { t: '新人必看的代码审查指南', v: '29 万' }
    ]
  }
};

export function makeDemo(name) {
  const k = name.trim().toLowerCase();
  if (DEMO[k]) return DEMO[k];
  const h = hash(name.trim().toLowerCase());
  const subs = (1 + (h % 90) / 10) * 1e6;
  const views = subs * (40 + h % 120);
  const views30 = views / 24 * (0.6 + (h % 5) / 10);
  const engage = (3 + (h % 70) / 10).toFixed(1);
  const trend = '+' + ((h % 18) + 2).toFixed(1) + '%';
  const videos = [
    { t: '频道新视频 #' + (h % 99), v: fmt(views30 / 7) },
    { t: '近期热门内容', v: fmt(views30 / 10) },
    { t: '日常更新', v: fmt(views30 / 14) }
  ];
  return {
    name: name.trim(), handle: '@' + name.trim().replace(/\s+/g, '') + ' · 成长型频道',
    subs: fmt(subs), views: fmt(views), views30: fmt(views30),
    engage: engage + '%', trend: trend, videos
  };
}

export function ruleConclusion(d) {
  const s = toNum(d.subs), e = parseFloat(d.engage);
  const list = [];
  if (s >= 1e8) list.push('订阅 ' + d.subs + '，属于头部频道，适合作为行业标杆对标分析。');
  else if (s >= 1e6) list.push('订阅 ' + d.subs + '，腰部成长型频道，近 30 天播放 ' + d.views30 + '，趋势 ' + d.trend + '，增速健康。');
  else list.push('订阅 ' + d.subs + '，成长型频道，建议用爆款选题快速测试方向。');
  if (e >= 8) list.push('互动率 ' + d.engage + ' 高于同类均值，粉丝粘性强，可加大评论引导与系列化内容。');
  else if (e >= 5) list.push('互动率 ' + d.engage + ' 处于中游，建议在结尾加提问 / 投票等互动钩子。');
  else list.push('互动率 ' + d.engage + ' 偏低，建议缩短开头铺垫、直接给结论，提升完播率。');
  list.push('建议下一步：生成 5 个选题方向 / 对比同类频道 / 深挖单条爆款视频。');
  return list;
}

/* ---------- 演示字幕（RAG 静态演示：关键词匹配） ---------- */
const TRANSCRIPTS = {
  'mrbeast': [
    { video: '我送给粉丝 100 辆车…', text: '今天我们要送出 100 辆车，其中 5 辆是特斯拉 Model 3，其余 95 辆是经济型家用车。准备了 1000 个信封，最终成功送出了全部 100 辆车。' },
    { video: '花 100 万美元给流浪汉买房子', text: '这一期我们花了 100 万美元，为 20 位流浪汉购买了房子，平均每栋房子 5 万美元。' },
    { video: '挑战 24 小时不眨眼', text: '我们挑战 24 小时不眨眼，用胶带固定眼皮，最终坚持到了最后，赢得了 10 万美元奖金。' }
  ]
};

export function demoAsk(channel, question) {
  const list = TRANSCRIPTS[String(channel).toLowerCase()] || [];
  if (!list.length) return { answer: '演示模式：暂无该频道的字幕数据（完整版接入后端后可索引真实字幕）。', sources: [] };
  const q = question.toLowerCase();
  const scored = list.map((t) => {
    let score = 0;
    for (const ch of '车辆房子挑战特斯拉流浪汉送') { if (q.includes(ch)) score++; }
    const text = t.text.toLowerCase();
    for (const ch of '车辆房子挑战特斯拉流浪汉送') { if (text.includes(ch)) score++; }
    return { ...t, score };
  }).sort((a, b) => b.score - a.score);
  const top = scored[0];
  return {
    answer: '根据字幕片段（演示数据）：' + top.text + '（《' + top.video + '》）',
    sources: [{ video: top.video, time: '00:00', text: top.text, score: Math.min(top.score * 10, 99) }]
  };
}

/* ---------- 电商演示生成器 ---------- */
export function ecomAnalyzeDemo(keyword) {
  const s = hash(keyword.trim().toLowerCase());
  const series = [];
  let base = 40 + s % 40;
  for (let i = 0; i < 12; i++) { base += 2 + ((s >> (i % 8)) % 7) - 3; series.push(Math.max(base, 20)); }
  const adjectives = ['便携式', '升级款', '多功能', '高颜值', '迷你'];
  const nouns = ['无线', '降噪', '快充', '防水', '磁吸'];
  const topProducts = [];
  for (let i = 0; i < 5; i++) {
    const h2 = s + i * 97;
    topProducts.push({
      name: adjectives[h2 % 5] + keyword + ' ' + nouns[(h2 >> 3) % 5],
      price: '$' + ((3 + (h2 % 120) / 10).toFixed(1)),
      sales: (1 + (h2 % 90) / 10).toFixed(1) + ' 万',
      growth: '+' + (20 + (h2 >> 4) % 120) + '%',
      competition: ['低', '中', '高'][(h2 >> 7) % 3]
    });
  }
  return {
    keyword, source: 'demo', region: '东南亚（TikTok Shop / Shopee / Lazada）',
    market: { series, growth: '+' + (15 + s % 50) + '%', size: ((1 + (s % 28) / 10).toFixed(1)) + ' 亿美元' },
    platforms: [
      { name: 'TikTok Shop', sales: (12 + s % 30) + ' 万单', growth: '+' + (40 + s % 40) + '%' },
      { name: 'Shopee', sales: (15 + s % 25) + ' 万单', growth: '+' + (15 + s % 25) + '%' },
      { name: 'Lazada', sales: (8 + s % 18) + ' 万单', growth: '+' + (8 + s % 20) + '%' }
    ],
    topProducts,
    competition: { level: ['低', '中', '高'][s % 3], sellers: String(300 + s % 3800), adCost: '$' + (0.3 + (s % 90) / 100).toFixed(2) },
    suggestions: [
      '主攻 TikTok Shop：' + keyword + ' 短视频带货增速最快，建议投 3 条带货视频测试',
      '定价带 ' + (3 + s % 6) + '-' + (8 + s % 9) + ' 美元区间竞争最小，转化率平均高 20%',
      '搭配 2-3 个赠品做组合装，客单价可提升 30%，同时提高店铺权重',
      '详情页突出「东南亚本地仓 3 天达」，物流时效是转化关键因子',
      '每周二/四 20:00-22:00 东南亚流量高峰投放，CPM 成本最低'
    ]
  };
}

export function ecomScriptDemo(product) {
  const s = hash('script' + product);
  return {
    product, source: 'demo',
    hook: '你是不是也遇到过【' + product + '】不好用的问题？今天 30 秒教你避坑！',
    body: [
      '第一幕（0-5s）：直接展示产品 + 核心卖点，节奏要快',
      '第二幕（5-15s）：真人试用 + 前后对比，突出「性价比高」',
      '第三幕（15-25s）：三个使用场景 + 价格锚点，引导点击购物车'
    ],
    cta: '点击下方购物车，今天下单立减 30%，还送 3 个赠品！',
    titles: [product + '避坑指南，看完再买不亏', '我用了 7 天' + product + '，结果……', '打工人必入！' + product + ' 实测分享'],
    caption: '🔥 ' + product + ' 实测分享｜东南亚现货 3 天达｜下单赠 3 件套',
    hashtags: ['#' + product.replace(/\s+/g, ''), '#TikTokShop', '#东南亚好物', '#开箱测评', '#爆款推荐']
  };
}

export function ecomPromptsDemo(product, style) {
  const s = hash('prompt' + product + style);
  const mood = ['明亮清新', '高级简约', '活力潮流', '温馨生活'][s % 4];
  const palette = ['米白 + 暖橙', '奶油 + 莫兰迪绿', '浅灰 + 亮黄', '奶咖 + 珊瑚红'][(s >> 3) % 4];
  const regionHint = '东南亚电商审美，人像为东南亚模特，TikTok Shop / Shopee / Lazada 平台规范';
  return {
    product, style: style || '东南亚审美', source: 'demo',
    main: '【商品主图】' + product + '，' + mood + '风格，浅色背景，产品居中占比 60%，品牌色 ' + palette + '，' + regionHint + '，4:5 竖版',
    detail: '【详情页首屏】' + product + ' 卖点分层排版：顶部大标题 + 三个核心卖点图标 + 底部参数表格，' + mood + '，留白充足，' + regionHint,
    scene: '【场景图】东南亚家庭客厅场景，' + product + ' 自然融入，午后自然光，生活气息，' + palette + '色调，' + regionHint,
    ad: '【广告图】促销氛围，' + product + ' + 优惠标签「-30% / 限时」，视觉冲击强，大色块，' + palette + '，适合 TikTok 信息流广告，' + regionHint,
    social: '【社媒配图】' + product + ' 开箱摆拍，INS 风网格构图，带 #TikTokShop 贴纸，' + regionHint
  };
}

/* ---------- 数据看板（CSV 解析 + 真实统计，无 LLM） ---------- */
export function ecomDataDemo(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows = [];
  for (const line of lines) {
    const parts = line.split(/[,，\t]/).map((p) => p.trim());
    if (parts.length < 2) continue;
    const n1 = parseFloat(parts[1]);
    if (parts[0] && !isNaN(n1)) {
      const n2 = parts.length > 2 && !isNaN(parseFloat(parts[2])) ? parseFloat(parts[2]) : null;
      rows.push({ label: parts[0], n1, n2 });
    }
  }
  if (rows.length < 2) throw new Error('数据太少，至少两行');
  const total = rows.reduce((a, r) => a + r.n1, 0);
  const peak = rows.reduce((a, r) => (r.n1 > a.n1 ? r : a));
  return {
    source: 'real',
    stats: {
      days: rows.length, totalOrders: total, avgOrders: Math.round(total / rows.length),
      peak: { label: peak.label, value: peak.n1 },
      trend: Math.round(((rows[rows.length - 1].n1 - rows[0].n1) / rows[0].n1) * 100)
    },
    series: rows,
    summary: [
      '日均订单 ' + Math.round(total / rows.length) + ' 单，峰值 ' + peak.label + '（' + peak.n1 + ' 单）。',
      '首尾趋势 ' + (rows[rows.length - 1].n1 >= rows[0].n1 ? '上升' : '下降') + '，数据共 ' + rows.length + ' 天。',
      '静态演示模式：接入后端后，AI 洞察由真实大模型生成。'
    ]
  };
}

/* ---------- 静态模式检测 ---------- */
let staticMode = null;
export async function detectStaticMode() {
  if (staticMode !== null) return staticMode;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch('/api/health', { signal: ctrl.signal });
    clearTimeout(t);
    staticMode = !r.ok;
  } catch (e) { staticMode = true; }
  return staticMode;
}
