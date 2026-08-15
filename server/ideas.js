'use strict';
/* ============================================================
   内容军师工作流生成器（服务端版，供 MCP 工具使用）
   ============================================================ */
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; } return h; }

function genWorkflow(channel, topic, goal) {
  const h = hash(channel + topic + goal);
  const ideas = [
    '「' + topic + '」入门指南：小白 10 分钟上手',
    '「' + topic + '」横评：哪个最适合打工人',
    '「' + topic + '」3 个免费替代品，别花冤枉钱',
    '我用「' + topic + '」1 天干了 1 周的活',
    '「' + topic + '」的 5 个隐藏技巧',
    '「' + topic + '」会被 AI 取代吗？'
  ];
  const i0 = h % 6, i1 = (i0 + 1 + (h >> 3) % 5) % 6, i2 = (i1 + 1 + (h >> 5) % 4) % 6;
  const titles = [
    '打工人必备！10 个' + topic + '神器，效率直接翻倍',
    '别再加班了，这 5 个免费' + topic + '工具救你',
    '实测 7 天：' + topic + '到底能不能提效 50%？',
    '别乱花钱！' + topic + '这样选才不踩坑',
    '我靠' + topic + '从 0 做到了 1 万粉丝',
    topic + '避坑指南：这 3 个坑我全踩过'
  ];
  const t0 = h % 6, t1 = (t0 + 1 + (h >> 4) % 5) % 6;
  return {
    channel, topic, goal,
    ideas: [
      { title: ideas[i0], reason: '契合「' + goal + '」目标 · 热度高 · 竞争中' },
      { title: ideas[i1], reason: '长尾搜索流量 · 热度中 · 竞争低' },
      { title: ideas[i2], reason: '情绪共鸣强 · 热度高 · 竞争高' }
    ],
    titles: [titles[t0], titles[(t0 + 1) % 6], titles[t1]],
    publish: [
      '发布时间：周二 / 周四 18:00-20:00（EST 晚高峰）',
      '描述要点：前 3 秒抛结果 → 工具清单 → 引导评论',
      '标签建议：#' + topic.replace(/\s+/g, '') + ' #AI #工具测评'
    ]
  };
}

module.exports = { genWorkflow };
