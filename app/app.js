/* ============================================================
   TubeInsight · 可运行版逻辑
   演示数据默认跑通流程；填 Key 后自动切真实数据
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- 本地存储 ---------- */
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var state = {
    analyses: load('ti_analyses', []),
    workflows: load('ti_workflows', []),
    last: null
  };
  function persist() { save('ti_analyses', state.analyses); save('ti_workflows', state.workflows); }

  /* ---------- 图标 ---------- */
  var ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
  };
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    el.innerHTML = ICONS[el.dataset.icon] || '';
  });

  /* ---------- 演示数据 ---------- */
  var DEMO = {
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

  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; } return h; }
  function fmt(n) {
    if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\.0$/, '') + ' 亿';
    if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, '') + ' 万';
    return String(Math.round(n));
  }
  function toNum(str) {
    str = String(str).trim();
    if (str.indexOf('亿') >= 0) return parseFloat(str) * 1e8;
    if (str.indexOf('万') >= 0) return parseFloat(str) * 1e4;
    return parseFloat(str) || 0;
  }
  function ago(ts) {
    var m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return '刚刚';
    if (m < 60) return m + ' 分钟前';
    var h = Math.floor(m / 60);
    if (h < 24) return h + ' 小时前';
    return Math.floor(h / 24) + ' 天前';
  }

  function makeDemo(name) {
    var k = name.trim().toLowerCase();
    if (DEMO[k]) return DEMO[k];
    var h = hash(name.trim().toLowerCase());
    var subs = (1 + (h % 90) / 10) * 1e6;
    var views = subs * (40 + h % 120);
    var views30 = views / 24 * (0.6 + (h % 5) / 10);
    var engage = (3 + (h % 70) / 10).toFixed(1);
    var trend = '+' + ((h % 18) + 2).toFixed(1) + '%';
    var videos = [
      { t: '频道新视频 #' + (h % 99), v: fmt(views30 / 7) },
      { t: '近期热门内容', v: fmt(views30 / 10) },
      { t: '日常更新', v: fmt(views30 / 14) }
    ];
    return {
      name: name.trim(), handle: '@' + name.trim().replace(/\s+/g, '') + ' · 成长型频道',
      subs: fmt(subs), views: fmt(views), views30: fmt(views30),
      engage: engage + '%', trend: trend, videos: videos
    };
  }

  function ruleConclusion(d) {
    var s = toNum(d.subs), e = parseFloat(d.engage), list = [];
    if (s >= 1e8) list.push('订阅 ' + d.subs + '，属于头部频道，适合作为行业标杆对标分析。');
    else if (s >= 1e6) list.push('订阅 ' + d.subs + '，腰部成长型频道，近 30 天播放 ' + d.views30 + '，趋势 ' + d.trend + '，增速健康。');
    else list.push('订阅 ' + d.subs + '，成长型频道，建议用爆款选题快速测试方向。');
    if (e >= 8) list.push('互动率 ' + d.engage + ' 高于同类均值，粉丝粘性强，可加大评论引导与系列化内容。');
    else if (e >= 5) list.push('互动率 ' + d.engage + ' 处于中游，建议在结尾加提问 / 投票等互动钩子。');
    else list.push('互动率 ' + d.engage + ' 偏低，建议缩短开头铺垫、直接给结论，提升完播率。');
    list.push('建议下一步：生成 5 个选题方向 / 对比同类频道 / 深挖单条爆款视频。');
    return list;
  }

  function themeBars(name) {
    var h = hash(name.toLowerCase());
    var a = h % 55 + 10;
    var b = (h >> 3) % Math.max(85 - a, 1) + 5;
    var c = (h >> 6) % Math.max(85 - a - b, 1) + 5;
    var d = 100 - a - b - c;
    if (d < 0) d = 5;
    return [['挑战类', a], ['教程类', b], ['测评类', c], ['日常类', d]];
  }

  /* ---------- 真实数据接入位 1：YouTube Data API ---------- */
  async function fetchRealChannel(name) {
    var key = $('ytKey').value.trim();
    if (!key) return null;
    var sj = await fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=' +
      encodeURIComponent(name) + '&maxResults=1&key=' + key);
    var sjd = await sj.json();
    var chId = sjd.items && sjd.items[0] && sjd.items[0].id && sjd.items[0].id.channelId;
    if (!chId) throw new Error('channel not found');
    var cj = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=' + chId + '&key=' + key);
    var cjd = await cj.json();
    var item = cjd.items && cjd.items[0];
    if (!item) throw new Error('channel detail not found');
    var s = item.statistics || {};
    var subs = parseInt(s.subscriberCount || 0, 10);
    var views = parseInt(s.viewCount || 0, 10);
    var vs = await fetch('https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&channelId=' + chId +
      '&order=viewCount&maxResults=3&key=' + key);
    var vsd = await vs.json();
    var ids = (vsd.items || []).map(function (i) { return i.id.videoId; }).join(',');
    var videos = [], likes = 0, comments = 0;
    if (ids) {
      var vd = await fetch('https://www.googleapis.com/youtube/v3/videos?part=statistics&id=' + ids + '&key=' + key);
      var vdd = await vd.json();
      (vdd.items || []).forEach(function (v, idx) {
        var vst = v.statistics || {};
        var title = (vsd.items[idx] && vsd.items[idx].snippet) ? vsd.items[idx].snippet.title : '视频';
        videos.push({ t: title, v: fmt(parseInt(vst.viewCount || 0, 10)) });
        likes += parseInt(vst.likeCount || 0, 10);
        comments += parseInt(vst.commentCount || 0, 10);
      });
    }
    var viewSum = videos.reduce(function (a, x) { return a + toNum(x.v); }, 0);
    var engage = viewSum > 0 ? ((likes + comments) / viewSum * 100).toFixed(1) : '—';
    return {
      name: item.snippet.title, handle: (item.snippet.customUrl || '') + ' · ' + (item.snippet.country || '—'),
      subs: fmt(subs), views: fmt(views), views30: '—', engage: engage + '%', trend: '实时',
      videos: videos, real: true
    };
  }

  /* ---------- 真实数据接入位 2：LLM 生成结论 ---------- */
  async function llmConclusion(d) {
    var key = $('llmKey').value.trim();
    if (!key) return null;
    var sys = '你是海外 YouTube 内容分析师。请用中文输出 3 条简洁分析结论，每条用「- 」开头，不超过 45 字，不要多余解释。';
    var r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: sys }, { role: 'user', content: '频道数据：' + JSON.stringify(d) }],
        temperature: 0.6
      })
    });
    if (!r.ok) return null;
    var j = await r.json();
    var text = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!text) return null;
    return text.split('\n').map(function (s) { return s.replace(/^-\s*/, '').trim(); }).filter(Boolean).slice(0, 3);
  }

  async function analyze(name) {
    var data = null, real = false, note = '';
    if ($('ytKey').value.trim()) {
      try {
        data = await fetchRealChannel(name);
        real = !!data;
        if (!data) note = '（未找到该频道，回退演示数据）';
      } catch (e) { note = '（真实 API 调用失败，回退演示数据）'; }
    }
    if (!data) data = makeDemo(name);
    var concl = null;
    if ($('llmKey').value.trim()) {
      try { concl = await llmConclusion(data); } catch (e) { concl = null; }
    }
    return { data: data, real: real, concl: concl || ruleConclusion(data), note: note };
  }

  /* ---------- 导航 ---------- */
  var navBtns = Array.prototype.slice.call(document.querySelectorAll('.nav-item'));
  function goto(page) {
    navBtns.forEach(function (b) { b.classList.toggle('active', b.dataset.page === page); });
    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.toggle('active', p.id === 'page-' + page);
    });
    document.querySelector('.content').scrollTop = 0;
    if (page === 'dashboard') renderDashboard();
    if (page === 'channel') renderChannelView();
    if (page === 'workflow') refreshWfChannel();
  }
  navBtns.forEach(function (b) { b.addEventListener('click', function () { goto(b.dataset.page); }); });

  /* ---------- Toast / 复制 ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function copyText(text, btn) {
    function done() {
      var old = btn.innerHTML;
      btn.innerHTML = '✓ 已复制';
      setTimeout(function () { btn.innerHTML = old; }, 1500);
    }
    function fb() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(ta); done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fb);
    } else fb();
  }
  document.addEventListener('click', function (e) {
    var jt = e.target.closest('.json-toggle');
    if (jt) {
      var pre = jt.parentElement.querySelector('.json');
      var open = pre.classList.toggle('open');
      jt.textContent = '参数 JSON ' + (open ? '▴' : '▾');
      return;
    }
    var cb = e.target.closest('[data-copy]');
    if (cb) { copyText(cb.dataset.copy, cb); return; }
    var tb = e.target.closest('[data-toast]');
    if (tb) { toast(tb.dataset.toast); return; }
    var gb = e.target.closest('[data-goto]');
    if (gb) { goto(gb.dataset.goto); }
  });

  /* ---------- 主题 / 模型 ---------- */
  var themeBtn = $('themeToggle');
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    var ic = themeBtn.querySelector('[data-icon]');
    ic.dataset.icon = t === 'light' ? 'sun' : 'moon';
    ic.innerHTML = ICONS[ic.dataset.icon];
    var ts = $('themeSet'); if (ts) ts.value = t;
  }
  themeBtn.addEventListener('click', function () {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
  });
  $('langToggle').addEventListener('click', function () { toast('🌐 语言切换（演示）'); });

  var ms = $('modelSelect'), dd = $('modelDropdown');
  ms.addEventListener('click', function (e) { e.stopPropagation(); dd.classList.toggle('open'); });
  document.addEventListener('click', function () { dd.classList.remove('open'); });
  dd.querySelectorAll('.model-opt').forEach(function (o) {
    o.addEventListener('click', function () {
      ms.querySelector('.m-name').textContent = o.dataset.name;
      dd.classList.remove('open');
    });
  });

  /* ---------- 工作台 ---------- */
  function renderDashboard() {
    var n = state.analyses.length;
    $('dsCount').textContent = n;
    $('dsApi').textContent = n * 24;
    var last = state.analyses[0];
    $('dsTrend').textContent = last ? last.data.trend : '—';
    $('dsTrendSub').textContent = last ? (last.data.name + ' · 最新分析') : '分析后更新';
    var ul = $('dashList'); ul.innerHTML = '';
    if (!n) ul.innerHTML = '<div class="empty-sm">还没有分析记录，去对话页试试</div>';
    state.analyses.forEach(function (a) {
      var row = document.createElement('div');
      row.className = 'list-item'; row.style.cursor = 'pointer';
      row.innerHTML = '<span class="channel-ico"><i data-icon="play"></i></span>' +
        '<div class="li-main"><b>' + esc(a.name) + '</b><div class="li-sub">' + ago(a.ts) + ' · 互动率 ' + esc(a.data.engage) + '</div></div>' +
        '<span class="tag tag-success">✓ 完成</span>';
      (function (an) {
        row.addEventListener('click', function () {
          state.last = an; persist(); renderChannelView(); goto('channel');
        });
      })(a);
      ul.appendChild(row);
    });
    var w = $('dashWf'); w.innerHTML = '';
    if (!state.workflows.length) w.innerHTML = '<div class="empty-sm">还没有工作流记录，去内容军师页跑一次</div>';
    state.workflows.forEach(function (x) {
      var row = document.createElement('div');
      row.className = 'wf-item';
      row.innerHTML = '<span class="tag tag-ai"><i data-icon="zap"></i>内容军师</span>' +
        '<span class="wf-name">' + esc(x.topic) + '（' + esc(x.channel) + '）</span>' +
        '<span class="wf-meta">' + x.time + ' · 42s</span><span class="tag tag-success">✓</span>';
      w.appendChild(row);
    });
  }

  /* ---------- Agent 对话 ---------- */
  var msgs = $('messages');
  function appendMsg(kind, text, typing) {
    var row = document.createElement('div');
    row.className = 'msg' + (kind === 'user' ? ' user' : '');
    if (kind === 'user') row.innerHTML = '<div class="msg-avatar u">你</div><div class="bubble">' + esc(text) + '</div>';
    else if (typing) row.innerHTML = '<div class="msg-avatar ai">AI</div><div class="bubble typing"><span class="tdot"></span><span class="tdot"></span><span class="tdot"></span></div>';
    else row.innerHTML = '<div class="msg-avatar ai">AI</div><div class="bubble">' + text + '</div>';
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
    return row;
  }

  function tlReset() {
    document.querySelectorAll('#timeline .timeline-item').forEach(function (it) {
      var ico = it.querySelector('.step-ico');
      ico.className = 'step-ico wait'; ico.textContent = '○';
      it.querySelector('.t-time').textContent = '—';
    });
  }
  function tlSet(step, st, time) {
    var it = document.querySelector('#timeline .timeline-item[data-step="' + step + '"]');
    if (!it) return;
    var ico = it.querySelector('.step-ico');
    ico.className = 'step-ico ' + st;
    ico.textContent = st === 'done' ? '✓' : (st === 'run' ? '⟳' : '○');
    if (time) it.querySelector('.t-time').textContent = time;
  }

  function cleanName(raw) {
    var s = String(raw).replace(/@/g, '').replace(/^(分析|看看|查一下|了解|调查)\s*/, '').trim();
    return s || null;
  }

  function assistantHTML(r, name) {
    var d = r.data;
    var json = '{\n  "channel": "' + name + '",\n  "period": "30d",\n  "metrics": ["views", "likes", "comments"]\n}';
    var srcTag = r.real ? '<span class="tag tag-success">真实数据</span>' : '<span class="tag tag-warn">演示数据</span>';
    return '<p>好的，我先获取「' + esc(d.name) + '」的数据 👇</p>' +
      '<div class="toolcall">' +
      '<div class="toolcall-head"><span class="tc-ico">🔧</span><div><div class="tc-title">getChannelStats</div><div class="tc-sub">工具调用 · 0.8s</div></div><span class="tag tag-ai">Tool Calling</span></div>' +
      '<div class="json-body"><button class="json-toggle" type="button">参数 JSON ▾</button><pre class="json">' + json + '</pre></div>' +
      '<div class="tc-result">✅ 结果：频道「' + esc(d.name) + '」数据已获取' + (r.note ? ' ' + r.note : '') + '</div>' +
      '</div>' +
      '<p style="margin-top:12px"><b>分析结论：</b></p>' +
      '<ul class="concl-mini">' + r.concl.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
      '<table class="mini-table"><thead><tr><th>订阅</th><th>总播放</th><th>近30天播放</th><th>互动率</th><th>趋势</th></tr></thead>' +
      '<tbody><tr><td>' + esc(d.subs) + '</td><td>' + esc(d.views) + '</td><td>' + esc(d.views30) + '</td><td>' + esc(d.engage) + '</td><td class="up">' + esc(d.trend) + '</td></tr></tbody></table>' +
      '<div class="cites"><span class="tag tag-gray">🔗 来源：频道 ' + esc(d.name) + '</span>' + srcTag + '</div>';
  }

  function addCtxChip(name) {
    var box = $('ctxChips');
    var ph = box.querySelector('.chip-add');
    if (ph) ph.remove();
    var chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = '🔴 ' + name;
    box.appendChild(chip);
    var all = box.querySelectorAll('.chip');
    while (all.length > 6) box.removeChild(all[0]);
  }

  async function handleChatInput(raw) {
    var name = cleanName(raw);
    if (!name) { toast('请告诉我频道名，例如：分析 MrBeast'); return; }
    appendMsg('user', raw);
    var typing = appendMsg('ai', null, true);
    tlReset();
    tlSet(0, 'run'); await wait(400); tlSet(0, 'done', '0.2s');
    tlSet(1, 'run'); await wait(350); tlSet(1, 'done', 'getChannelStats · 0.3s');
    tlSet(2, 'run'); await wait(600);
    var r = await analyze(name);
    tlSet(2, 'done', '0.8s');
    tlSet(3, 'run'); await wait(500); tlSet(3, 'done', '2.4s');
    if (typing.parentNode) msgs.removeChild(typing);
    appendMsg('ai', assistantHTML(r, name));
    addCtxChip(name);
    state.analyses.unshift({ name: name, ts: Date.now(), data: r.data, real: r.real });
    if (state.analyses.length > 20) state.analyses = state.analyses.slice(0, 20);
    state.last = state.analyses[0];
    persist(); renderDashboard();
  }

  $('composer').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = $('chatInput').value.trim();
    if (!v) return;
    $('chatInput').value = '';
    handleChatInput(v);
  });
  document.querySelectorAll('#page-chat .chip[data-name]').forEach(function (c) {
    c.addEventListener('click', function () { handleChatInput(c.dataset.name); });
  });
  $('newChat').addEventListener('click', function () {
    $('messages').innerHTML = '<div class="msg"><div class="msg-avatar ai">AI</div><div class="bubble">新会话已开始。输入频道名即可分析 👇</div></div>';
    $('ctxChips').innerHTML = '<span class="chip chip-add">＋ 分析后自动添加</span>';
    tlReset();
  });

  /* ---------- 频道洞察 ---------- */
  function renderChannelView() {
    if (state.last) renderChannel(state.last.data, state.last.real);
    else { $('chEmpty').hidden = false; $('chContent').hidden = true; }
  }
  function renderChannel(d, real) {
    $('chEmpty').hidden = true; $('chContent').hidden = false;
    $('chNameOut').textContent = d.name;
    var b = $('chBadge');
    b.textContent = real ? '真实数据' : '演示数据';
    b.className = 'data-badge ' + (real ? 'real' : 'demo');
    $('chMeta').textContent = d.handle;
    $('stSubs').textContent = d.subs; $('stSubsD').textContent = real ? 'YouTube API' : '内置演示';
    $('stViews').textContent = d.views; $('stViewsD').textContent = '累计';
    $('stViews30').textContent = d.views30;
    var tr = $('stTrend');
    tr.textContent = d.trend;
    tr.className = 'stat-delta' + (parseFloat(d.trend) < 0 ? ' down' : '');
    $('stEngage').textContent = d.engage;
    $('stEngageD').textContent = real ? '近3条视频估算' : '估算';
    var tb = $('vTable'); tb.innerHTML = '';
    (d.videos || []).forEach(function (v) {
      var r2 = document.createElement('tr');
      r2.innerHTML = '<td class="td-title">' + esc(v.t) + '</td><td>' + esc(v.v) + '</td><td><span class="tag tag-success">✓ 已分析</span></td>';
      tb.appendChild(r2);
    });
    var ab = $('aiBars'); ab.innerHTML = '';
    themeBars(d.name).forEach(function (x) {
      var row = document.createElement('div');
      row.className = 'hbar';
      row.innerHTML = '<span class="hbar-label">' + esc(x[0]) + '</span>' +
        '<div class="hbar-track"><div class="hbar-fill ai-fill" style="width:' + x[1] + '%"></div></div>' +
        '<span class="hbar-val">' + x[1] + '%</span>';
      ab.appendChild(row);
    });
    $('aiCite').innerHTML = '<span class="tag tag-gray">🔗 引用 ' + (20 + hash(d.name.toLowerCase()) % 40) + ' 段字幕</span>';
    var cl = $('conclList');
    cl.className = 'concl-mini';
    cl.innerHTML = '';
    ruleConclusion(d).forEach(function (t) {
      var li = document.createElement('li'); li.textContent = t; cl.appendChild(li);
    });
  }

  /* ---------- 内容军师 ---------- */
  function refreshWfChannel() {
    var sel = $('wfChannel'); sel.innerHTML = '';
    var names = [];
    state.analyses.forEach(function (a) { if (names.indexOf(a.name) < 0) names.push(a.name); });
    ['MrBeast', 'TechTok', 'CodeDaily', 'MusicLab'].forEach(function (n) { if (names.indexOf(n) < 0) names.push(n); });
    names.forEach(function (n) {
      var o = document.createElement('option');
      o.textContent = n; o.value = n; sel.appendChild(o);
    });
    if (state.last) sel.value = state.last.data.name;
  }

  $('wfRun').addEventListener('click', runWorkflow);
  async function runWorkflow() {
    var channel = $('wfChannel').value || 'MrBeast';
    var topic = $('wfTopic').value.trim() || 'AI 工具测评';
    var goal = $('wfGoal').value;
    var steps = Array.prototype.slice.call(document.querySelectorAll('#wfStepper .step'));
    var conns = Array.prototype.slice.call(document.querySelectorAll('#wfStepper .conn'));
    steps.forEach(function (s) { s.classList.remove('done', 'running'); });
    conns.forEach(function (c) { c.classList.remove('done'); });
    var btn = $('wfRun'), old = btn.innerHTML;
    btn.innerHTML = '⏳ 运行中…'; btn.disabled = true;
    for (var i = 0; i < steps.length; i++) {
      steps[i].classList.add('running');
      await wait(650 + i * 180);
      steps[i].classList.remove('running'); steps[i].classList.add('done');
      if (conns[i]) conns[i].classList.add('done');
    }
    btn.innerHTML = old; btn.disabled = false;
    $('wfResults').innerHTML = genWorkflow(channel, topic, goal);
    state.workflows.unshift({ channel: channel, topic: topic, time: ago(Date.now()) });
    if (state.workflows.length > 10) state.workflows = state.workflows.slice(0, 10);
    persist(); renderDashboard();
    toast('✅ 内容军师运行完成 · 总耗时 42s');
  }

  function genWorkflow(channel, topic, goal) {
    var h = hash(channel + topic + goal);
    var ideas = [
      '「' + topic + '」入门指南：小白 10 分钟上手',
      '「' + topic + '」横评：哪个最适合打工人',
      '「' + topic + '」3 个免费替代品，别花冤枉钱',
      '我用「' + topic + '」1 天干了 1 周的活',
      '「' + topic + '」的 5 个隐藏技巧',
      '「' + topic + '」会被 AI 取代吗？'
    ];
    var i0 = h % 6, i1 = (i0 + 1 + (h >> 3) % 5) % 6, i2 = (i1 + 1 + (h >> 5) % 4) % 6;
    var titles = [
      '打工人必备！10 个' + topic + '神器，效率直接翻倍',
      '别再加班了，这 5 个免费' + topic + '工具救你',
      '实测 7 天：' + topic + '到底能不能提效 50%？',
      '别乱花钱！' + topic + '这样选才不踩坑',
      '我靠' + topic + '从 0 做到了 1 万粉丝',
      topic + '避坑指南：这 3 个坑我全踩过'
    ];
    var t0 = h % 6, t1 = (t0 + 1 + (h >> 4) % 5) % 6;
    function opt(n, title, sub) {
      return '<div class="opt"><span class="opt-no">' + n + '</span><div class="opt-main"><b>' + esc(title) + '</b><div class="opt-sub">' + sub + '</div></div></div>';
    }
    return '' +
      '<div class="result-card"><div class="result-head"><span class="result-title">① 选题分析 <span class="tag tag-success">✓ 完成</span></span>' +
      '<span><button class="btn btn-sm btn-ghost" data-copy="' + esc(ideas[i0]) + '"><i data-icon="copy"></i>复制</button>' +
      '<button class="btn btn-sm btn-ghost" data-toast="已导出（演示）"><i data-icon="download"></i>导出</button></span></div>' +
      '<div class="options">' +
      opt(1, ideas[i0], '理由：契合「' + esc(goal) + '」目标 · 热度 <span class="tag tag-warn">🔥 高</span> 竞争 <span class="tag tag-gray">中</span>') +
      opt(2, ideas[i1], '理由：长尾搜索流量 · 热度 <span class="tag tag-gray">中</span> 竞争 <span class="tag tag-success">低</span>') +
      opt(3, ideas[i2], '理由：情绪共鸣强 · 热度 <span class="tag tag-warn">🔥 高</span> 竞争 <span class="tag tag-warn">高</span>') +
      '</div></div>' +
      '<div class="result-card"><div class="result-head"><span class="result-title">③ 标题生成 <span class="tag tag-success">✓ 完成</span></span>' +
      '<button class="btn btn-sm btn-ghost" data-toast="标题已复制（演示）"><i data-icon="copy"></i>复制全部</button></div>' +
      '<div class="options">' +
      '<div class="opt"><span class="tag tag-ai">A</span><div class="opt-main"><b>' + esc(titles[t0]) + '</b></div></div>' +
      '<div class="opt"><span class="tag tag-ai">A</span><div class="opt-main"><b>' + esc(titles[(t0 + 1) % 6]) + '</b></div></div>' +
      '<div class="opt"><span class="tag tag-ai">B</span><div class="opt-main"><b>' + esc(titles[t1]) + '</b></div></div>' +
      '</div></div>' +
      '<div class="result-card"><div class="result-head"><span class="result-title">⑤ 发布建议 <span class="tag tag-success">✓ 完成</span></span>' +
      '<button class="btn btn-sm btn-ghost" data-copy="发布时间：周二 / 周四 18:00-20:00（EST）"><i data-icon="download"></i>导出 Markdown</button></div>' +
      '<div class="opt-main">发布时间：周二 / 周四 18:00-20:00（EST 晚高峰）</div>' +
      '<div class="opt-main" style="margin-top:6px">描述要点：前 3 秒抛结果 → 工具清单 → 引导评论「你最想试哪个？」</div>' +
      '<div class="opt-main" style="margin-top:6px">标签建议：#' + esc(topic.replace(/\s+/g, '')) + ' #AI #工具测评</div>' +
      '</div>';
  }

  /* ---------- 设置 ---------- */
  $('saveKeys').addEventListener('click', function () {
    try {
      localStorage.setItem('ti_ytKey', $('ytKey').value.trim());
      localStorage.setItem('ti_llmKey', $('llmKey').value.trim());
    } catch (e) {}
    var b = $('saveKeys'), old = b.innerHTML;
    b.innerHTML = '✓ 已保存';
    setTimeout(function () { b.innerHTML = old; }, 1500);
    toast('Key 已保存到本机');
  });
  try {
    $('ytKey').value = localStorage.getItem('ti_ytKey') || '';
    $('llmKey').value = localStorage.getItem('ti_llmKey') || '';
  } catch (e) {}
  $('clearData').addEventListener('click', function () {
    try { localStorage.removeItem('ti_analyses'); localStorage.removeItem('ti_workflows'); } catch (e) {}
    location.reload();
  });
  $('themeSet').addEventListener('change', function () { setTheme(this.value); });
  $('langSet').addEventListener('change', function () { toast('🌐 语言切换（演示）'); });
  $('modelSet').addEventListener('change', function () {
    document.querySelector('.m-name').textContent = this.value.replace('（开发期）', '');
  });

  /* ---------- 初始化 ---------- */
  if (state.analyses.length && !state.last) state.last = state.analyses[0];
  renderDashboard();
  refreshWfChannel();
})();
