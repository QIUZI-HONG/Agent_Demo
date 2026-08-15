'use strict';
/* TubeInsight · 演示数据与生成器（无 Key 时保证流程可跑通） */

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

function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; } return h; }

function fmt(n) {
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

/* 确定性伪随机：同一个频道名每次结果一致 */
function makeDemo(name) {
  const k = name.trim().toLowerCase();
  if (DEMO[k]) return DEMO[k];
  const h = hash(name.trim().toLowerCase());
  const subs = (1 + (h % 90) / 10) * 1e6;              // 100万 ~ 1000万
  const views = subs * (40 + h % 120);                 // 总播放
  const views30 = views / 24 * (0.6 + (h % 5) / 10);   // 近30天
  const engage = (3 + (h % 70) / 10).toFixed(1);       // 3.0% ~ 9.9%
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

/* 规则版结论（无 LLM Key 时的兜底，让流程始终能跑通） */
function ruleConclusion(d) {
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

module.exports = { DEMO, hash, fmt, toNum, makeDemo, ruleConclusion };
