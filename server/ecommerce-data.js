'use strict';
/* ============================================================
   跨境电商演示数据生成器（零依赖、确定性伪随机）
   覆盖新 JD：选品分析 / 数据看板 / 短视频脚本 / AI 出图 Prompt
   ============================================================ */

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; } return h; }
function fmtNum(n) { return n.toLocaleString('en-US'); }
function seed(k) { return hash(String(k).trim().toLowerCase()); }

/* ---------- ① AI 跨境选品分析 ---------- */
function analyzeKeyword(keyword) {
  const s = seed(keyword);
  const region = '东南亚（TikTok Shop / Shopee / Lazada）';
  // 12 个月市场指数（确定性波动）
  const series = [];
  let base = 40 + s % 40;
  for (let i = 0; i < 12; i++) {
    base += 2 + ((s >> (i % 8)) % 7) - 3;
    series.push(Math.max(base, 20));
  }
  const growth = 15 + s % 50;                       // +15% ~ +64%
  const size = (1 + (s % 28) / 10).toFixed(1);      // 1.0 ~ 3.8 亿美元
  const competition = ['低', '中', '高'][s % 3];
  const sellers = 300 + s % 3800;
  const adCost = (0.3 + (s % 90) / 100).toFixed(2);

  const platformTpl = [
    { name: 'TikTok Shop', sales: 12 + s % 30, growth: 40 + s % 40 },
    { name: 'Shopee', sales: 15 + s % 25, growth: 15 + s % 25 },
    { name: 'Lazada', sales: 8 + s % 18, growth: 8 + s % 20 }
  ].map((p) => ({ ...p, sales: p.sales + ' 万单' }));
  platformTpl[0].growth = platformTpl[0].growth + '%';
  platformTpl[1].growth = platformTpl[1].growth + '%';
  platformTpl[2].growth = platformTpl[2].growth + '%';

  const adjectives = ['便携式', '升级款', '多功能', '高颜值', '迷你', '智能'];
  const nouns = ['无线', '降噪', '快充', '防水', '磁吸', '夜光'];
  const names = [];
  for (let i = 0; i < 5; i++) {
    const h2 = s + i * 97;
    names.push({
      name: adjectives[h2 % 6] + keyword + ' ' + nouns[(h2 >> 3) % 6],
      price: '$' + ((3 + (h2 % 120) / 10).toFixed(1)),
      sales: (1 + (h2 % 90) / 10).toFixed(1) + ' 万',
      growth: '+' + (20 + (h2 >> 4) % 120) + '%',
      competition: ['低', '中', '高'][(h2 >> 7) % 3]
    });
  }

  const suggestions = [
    '主攻 TikTok Shop：' + keyword + ' 短视频带货增速最快，建议投 3 条带货视频测试',
    '定价带 ' + (3 + s % 6) + '-' + (8 + s % 9) + ' 美元区间竞争最小，转化率平均高 20%',
    '搭配 2-3 个赠品做组合装，客单价可提升 30%，同时提高店铺权重',
    '详情页突出「东南亚本地仓 3 天达」，物流时效是转化关键因子',
    '每周二/四 20:00-22:00 东南亚流量高峰投放，CPM 成本最低'
  ];

  return {
    keyword, region, source: '演示数据',
    market: { series, growth: '+' + growth + '%', size: size + ' 亿美元' },
    platforms: platformTpl,
    topProducts: names,
    competition: { level: competition, sellers: fmtNum(sellers), adCost: '$' + adCost },
    suggestions
  };
}

/* ---------- ② 数据看板（订单/流量/竞品） ---------- */
function dashboardData() {
  const s = seed('dashboard');
  const orders = [], traffic = [], days = [];
  let o = 60 + s % 60, t = 3000 + s % 2500;
  for (let i = 0; i < 30; i++) {
    o += Math.round(((s >> (i % 10)) % 9) - 4);
    t += Math.round(((s >> (i % 6)) % 300) - 150);
    orders.push(Math.max(o, 20));
    traffic.push(Math.max(t, 1200));
    days.push((i + 1) + ' 日');
  }
  const stats = {
    revenue: '$' + fmtNum(orders.reduce((a, x) => a + x, 0) * 4.2),
    orders: fmtNum(orders.reduce((a, x) => a + x, 0)),
    conv: (2.1 + (s % 30) / 10).toFixed(1) + '%',
    adRoas: (2.8 + (s % 40) / 10).toFixed(1) + 'x'
  };
  const competitors = [
    { name: '竞品 A（头部）', price: '$12.9', sales: '8.2 万', rating: '4.8', gap: '价格高 30%' },
    { name: '竞品 B（腰部）', price: '$9.9', sales: '3.1 万', rating: '4.6', gap: '赠品少 2 个' },
    { name: '本店（目标）', price: '$8.9', sales: '0.8 万', rating: '4.7', gap: '价格有优势' }
  ];
  return { days, orders, traffic, stats, competitors, source: '演示数据' };
}

/* ---------- ③ 短视频脚本工作流 ---------- */
function generateScript(product) {
  const s = seed('script' + product);
  const pain = ['不好用', '效果差', '太贵', '不会选', '踩过坑'];
  const benefit = ['提升效率', '性价比高', '颜值在线', '一用就上瘾', '售后无忧'];
  return {
    product,
    hook: '你是不是也遇到过【' + product + '】' + pain[s % 5] + '的问题？今天 30 秒教你避坑！',
    body: [
      '第一幕（0-5s）：直接展示产品 + 核心卖点，节奏要快',
      '第二幕（5-15s）：真人试用 + 前后对比，突出「' + benefit[(s >> 3) % 5] + '」',
      '第三幕（15-25s）：三个使用场景 + 价格锚点，引导点击购物车'
    ],
    cta: '点击下方购物车，今天下单立减 30%，还送 3 个赠品！',
    titles: [
      product + '避坑指南，看完再买不亏',
      '我用了 7 天' + product + '，结果……',
      '打工人必入！' + product + ' 实测分享'
    ],
    caption: '🔥 ' + product + ' 实测分享｜东南亚现货 3 天达｜下单赠 3 件套',
    hashtags: ['#' + product.replace(/\s+/g, ''), '#TikTokShop', '#东南亚好物', '#开箱测评', '#爆款推荐']
  };
}

/* ---------- ④ AI 出图 Prompt 工作台 ---------- */
function generateImagePrompts(product, style) {
  const s = seed('prompt' + product + style);
  const mood = ['明亮清新', '高级简约', '活力潮流', '温馨生活'][s % 4];
  const palette = ['米白 + 暖橙', '奶油 + 莫兰迪绿', '浅灰 + 亮黄', '奶咖 + 珊瑚红'][(s >> 3) % 4];
  const regionHint = '东南亚电商审美，人像为东南亚模特，TikTok Shop / Shopee / Lazada 平台规范';
  return {
    style, product,
    main: '【商品主图】' + product + '，' + mood + '风格，浅色背景，产品居中占比 60%，带轻微投影，品牌色 ' + palette + '，' + regionHint + '，4:5 竖版',
    detail: '【详情页首屏】' + product + ' 卖点分层排版：顶部大标题 + 三个核心卖点图标 + 底部参数表格，' + mood + '，留白充足，' + regionHint,
    scene: '【场景图】东南亚家庭客厅场景，' + product + ' 自然融入，午后自然光，生活气息，' + palette + '色调，' + regionHint,
    ad: '【广告图】促销氛围，' + product + ' + 优惠标签「-30% / 限时」，视觉冲击强，大色块，' + palette + '，适合 TikTok 信息流广告，' + regionHint,
    social: '【社媒配图】' + product + ' 开箱摆拍，INS 风网格构图，ins 高光滤镜，带 #TikTokShop 贴纸，' + regionHint
  };
}

module.exports = { analyzeKeyword, dashboardData, generateScript, generateImagePrompts };
