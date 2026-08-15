import React, { useCallback, useEffect, useRef, useState } from 'react';
import { analyze as apiAnalyze, saveConfig, getConfig, ingest as apiIngest, ask as apiAsk, testConnection as apiTestConnection, ecomAnalyze, ecomDashboard, ecomScript, ecomPrompts, ecomData } from './api.js';
import { makeDemo, ruleConclusion, demoAsk, ecomAnalyzeDemo, ecomScriptDemo, ecomPromptsDemo, ecomDataDemo, detectStaticMode } from './demoData.js';

/* ============ 图标 ============ */
const ICONS = {
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
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};
const Icon = ({ name }) => <i dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />;

/* ============ 工具函数 ============ */
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ago = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return '刚刚';
  if (m < 60) return m + ' 分钟前';
  const h = Math.floor(m / 60);
  if (h < 24) return h + ' 小时前';
  return Math.floor(h / 24) + ' 天前';
};
const LOAD = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const SAVE = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

function themeBars(name) {
  const h = hash(name.toLowerCase());
  // 注意：必须用无符号右移 >>>（h 可能超过 2^31，>> 会产生负数）
  const a = 10 + h % 45;                // 10..54
  const b = 10 + (h >>> 3) % 45;        // 10..54
  const c = 10 + (h >>> 6) % 45;        // 10..54
  const list = [['挑战类', a], ['教程类', b], ['测评类', c], ['日常类', Math.max(100 - a - b - c, 5)]];
  // 归一化：保证四项总和 = 100 且每项不低于 5
  let diff = list.reduce((s, x) => s + x[1], 0) - 100;
  for (let i = 0; i < 3 && diff !== 0; i++) {
    const room = list[i][1] - 5;
    const take = Math.min(Math.abs(diff), room);
    if (diff > 0) { list[i][1] -= take; diff -= take; }
    else { list[i][1] += take; diff += take; }
  }
  return list;
}
function copyText(text, btn) {
  const done = () => { const old = btn.innerHTML; btn.innerHTML = '✓ 已复制'; setTimeout(() => { btn.innerHTML = old; }, 1500); };
  const fb = () => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta); done();
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fb);
  else fb();
}
function assistantHTML(r, name, d) {
  const json = '{\n  "channel": "' + name + '",\n  "period": "30d",\n  "metrics": ["views", "likes", "comments"]\n}';
  const srcTag = r.real ? '<span class="tag tag-success">真实数据</span>' : '<span class="tag tag-warn">演示数据</span>';
  return '<p>好的，我先获取「' + esc(d.name) + '」的数据 👇</p>' +
    '<div class="toolcall">' +
    '<div class="toolcall-head"><span class="tc-ico">🔧</span><div><div class="tc-title">getChannelStats</div><div class="tc-sub">工具调用 · 0.8s</div></div><span class="tag tag-ai">Tool Calling</span></div>' +
    '<div class="json-body"><button class="json-toggle" type="button">参数 JSON ▾</button><pre class="json">' + json + '</pre></div>' +
    '<div class="tc-result">✅ 结果：频道「' + esc(d.name) + '」数据已获取' + (r.note ? ' ' + r.note : '') + '</div>' +
    '</div>' +
    '<p style="margin-top:12px"><b>分析结论：</b></p>' +
    '<ul class="concl-mini">' + (r.concl || []).map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
    '<table class="mini-table"><thead><tr><th>订阅</th><th>总播放</th><th>近30天播放</th><th>互动率</th><th>趋势</th></tr></thead>' +
    '<tbody><tr><td>' + esc(d.subs) + '</td><td>' + esc(d.views) + '</td><td>' + esc(d.views30) + '</td><td>' + esc(d.engage) + '</td><td class="up">' + esc(d.trend) + '</td></tr></tbody></table>' +
    '<div class="cites"><span class="tag tag-gray">🔗 来源：频道 ' + esc(d.name) + '</span>' + srcTag + '</div>';
}
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
  const opt = (n, title, sub) => '<div class="opt"><span class="opt-no">' + n + '</span><div class="opt-main"><b>' + esc(title) + '</b><div class="opt-sub">' + sub + '</div></div></div>';
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

/* ============ App ============ */
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [model, setModel] = useState('DeepSeek-V3');
  const [toastMsg, setToastMsg] = useState(null);
  const [analyses, setAnalyses] = useState(() => LOAD('ti_analyses', []));
  const [workflows, setWorkflows] = useState(() => LOAD('ti_workflows', []));
  const [last, setLast] = useState(null);
  const [keys, setKeys] = useState({ ytKey: '', llmKey: '' });
  const [mobileNav, setMobileNav] = useState(false);
  const [staticMode, setStaticMode] = useState(false);
  const toastRef = useRef(null);

  useEffect(() => { detectStaticMode().then(setStaticMode).catch(() => setStaticMode(true)); }, []);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { SAVE('ti_analyses', analyses); }, [analyses]);
  useEffect(() => { SAVE('ti_workflows', workflows); }, [workflows]);
  useEffect(() => { getConfig().then((c) => setKeys({ ytKey: c.hasYt ? '已配置' : '', llmKey: c.hasLlm ? '已配置' : '' })).catch(() => {}); }, []);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2600); };
  useEffect(() => { toastRef.current = showToast; });

  /* 动态 HTML 内的 data-copy / data-toast 按钮（工作流结果、AI 消息） */
  useEffect(() => {
    const handler = (e) => {
      const cb = e.target.closest('[data-copy]');
      if (cb) { copyText(cb.dataset.copy, cb); return; }
      const tb = e.target.closest('[data-toast]');
      if (tb && toastRef.current) toastRef.current(tb.dataset.toast);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const goto = (p) => setPage(p);
  const openAnalysis = (a) => { setLast(a); setPage('channel'); };

  return (
    <div className="app">
      <Sidebar page={page} goto={goto} />
      <div className="main">
        <Topbar theme={theme} setTheme={setTheme} model={model} setModel={setModel} showToast={showToast} onMenu={() => setMobileNav(true)} />
        <main className="content">
          {staticMode && <div className="banner" style={{ marginBottom: 16 }}>静态演示模式：在线展示版，当前使用内置演示数据。完整功能（真实 LLM / RAG / YouTube）请本地运行：git clone 后 <b>start.bat</b> 启动。</div>}
          {page === 'dashboard' && <Dashboard analyses={analyses} workflows={workflows} goto={goto} onOpen={openAnalysis} />}
          {page === 'chat' && <ChatPage setAnalyses={setAnalyses} setLast={setLast} showToast={showToast} goto={goto} />}
          {page === 'channel' && <ChannelPage last={last} goto={goto} />}
          {page === 'workflow' && <WorkflowPage analyses={analyses} setWorkflows={setWorkflows} last={last} showToast={showToast} />}
          {page === 'ecom' && <EcomPage showToast={showToast} />}
          {page === 'settings' && <SettingsPage keys={keys} setKeys={setKeys} showToast={showToast} theme={theme} setTheme={setTheme} />}
        </main>
      </div>
      <div className={'toast' + (toastMsg ? ' show' : '')}>{toastMsg}</div>
      {mobileNav && <MobileNav page={page} goto={goto} onClose={() => setMobileNav(false)} />}
    </div>
  );
}

/* ============ 侧边栏 ============ */
function Sidebar({ page, goto }) {
  const items = [
    ['dashboard', 'home', '工作台'],
    ['chat', 'chat', 'Agent 对话'],
    ['channel', 'chart', '频道洞察'],
    ['workflow', 'zap', '内容军师'],
    ['ecom', 'bag', '跨境电商'],
    ['settings', 'settings', '设置']
  ];
  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-badge"><svg viewBox="0 0 24 24" width="14" height="14"><rect x="1.5" y="4" width="21" height="16" rx="5" fill="#fff" opacity=".25" /><polygon points="9,8 17,12 9,16" fill="#fff" /></svg></span>
        <span>TubeInsight</span>
        <span className="chip-preview">React 版</span>
      </div>
      <nav className="nav">
        {items.map(([p, ic, label]) => (
          <button key={p} className={'nav-item' + (page === p ? ' active' : '')} onClick={() => goto(p)}>
            <Icon name={ic} />{label}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="mcp-status"><span className="status-dot"></span>MCP 工具已就绪</div>
        <div className="user-card">
          <div className="avatar sm">E</div>
          <div><div className="u-name">Eason Chen</div><div className="u-role">实习生</div></div>
        </div>
      </div>
    </aside>
  );
}

/* ============ 顶栏 ============ */
function Topbar({ theme, setTheme, model, setModel, showToast, onMenu }) {
  const [open, setOpen] = useState(false);
  const models = ['DeepSeek-V3', 'Claude 4.5 Sonnet', 'GPT-4.1'];
  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" title="菜单" onClick={onMenu}><Icon name="menu" /></button>
      <div className="search"><Icon name="search" /><span>搜索频道 / 视频 / 历史分析</span><span className="kbd">⌘K</span></div>
      <div className="top-actions">
        <div className="model-select" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
          <span className="m-status"></span><span className="m-name">{model}</span><Icon name="chevron" />
          {open && (
            <div className="dropdown open">
              {models.map((m) => (
                <button key={m} className="model-opt" onClick={(e) => { e.stopPropagation(); setModel(m); setOpen(false); }}>{m}</button>
              ))}
              <div className="dropdown-note">开发期建议低成本模型，生产可切换顶级模型</div>
            </div>
          )}
        </div>
        <button className="icon-btn" title="切换主题" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          <Icon name={theme === 'light' ? 'sun' : 'moon'} />
        </button>
        <button className="icon-btn" title="切换语言" onClick={() => showToast('🌐 语言切换（演示）')}>中 / EN</button>
        <div className="avatar">E</div>
      </div>
    </header>
  );
}

/* ============ 移动端导航（窄窗口替代侧边栏） ============ */
function MobileNav({ page, goto, onClose }) {
  const items = [
    ['dashboard', 'home', '工作台'],
    ['chat', 'chat', 'Agent 对话'],
    ['channel', 'chart', '频道洞察'],
    ['workflow', 'zap', '内容军师'],
    ['ecom', 'bag', '跨境电商'],
    ['settings', 'settings', '设置']
  ];
  return (
    <div className="mobile-nav">
      <div className="logo">
        <span className="logo-badge"><svg viewBox="0 0 24 24" width="14" height="14"><rect x="1.5" y="4" width="21" height="16" rx="5" fill="#fff" opacity=".25" /><polygon points="9,8 17,12 9,16" fill="#fff" /></svg></span>
        <span>TubeInsight</span>
        <button className="icon-btn" style={{ marginLeft: 'auto' }} title="关闭" onClick={onClose}><Icon name="x" /></button>
      </div>
      {items.map(([p, ic, label]) => (
        <button key={p} className={'nav-item' + (page === p ? ' active' : '')} onClick={() => { goto(p); onClose(); }}>
          <Icon name={ic} />{label}
        </button>
      ))}
      <div className="mcp-status" style={{ marginTop: 'auto', padding: '12px 8px' }}><span className="status-dot"></span>MCP 工具已就绪</div>
    </div>
  );
}

/* ============ 工作台 ============ */
function Dashboard({ analyses, workflows, goto, onOpen }) {
  const n = analyses.length;
  const last = analyses[0];
  return (
    <section>
      <div className="greet">
        <div><h1>上午好，Eason 👋</h1><p>你的频道分析助手已就绪，输入频道名就能跑通完整流程。</p></div>
        <div className="greet-actions">
          <button className="btn btn-primary" onClick={() => goto('chat')}><Icon name="plus" />新建分析</button>
          <button className="btn btn-secondary" onClick={() => goto('workflow')}><Icon name="zap" />内容军师</button>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card"><span className="stat-label">已分析频道</span><span className="stat-value">{n}</span><span className="stat-sub">累计</span></div>
        <div className="stat-card"><span className="stat-label">进行中任务</span><span className="stat-value">0 / 0</span><span className="stat-sub">全部完成</span></div>
        <div className="stat-card"><span className="stat-label">API 调用</span><span className="stat-value">{n * 24}</span><span className="stat-sub">本次会话累计</span></div>
        <div className="stat-card"><span className="stat-label">最近播放趋势</span><span className="stat-value">{last ? last.data.trend : '—'}</span><span className="stat-sub">{last ? last.data.name + ' · 最新分析' : '分析后更新'}</span></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">最近分析 <span className="link-more" onClick={() => goto('chat')}>开始新分析 →</span></div>
          {n === 0
            ? <div className="empty-sm">还没有分析记录，去对话页试试</div>
            : analyses.map((a) => (
              <div key={a.name + a.ts} className="list-item" style={{ cursor: 'pointer' }} onClick={() => onOpen(a)}>
                <span className="channel-ico"><Icon name="play" /></span>
                <div className="li-main"><b>{a.name}</b><div className="li-sub">{ago(a.ts)} · 互动率 {a.data.engage}</div></div>
                <span className="tag tag-success">✓ 完成</span>
              </div>
            ))}
        </div>
        <div className="card">
          <div className="card-title">热门频道 Top 5</div>
          <div className="hbars">
            {[['MrBeast', 100, '2.1 亿'], ['TechTok', 70, '1.2 亿'], ['MusicLab', 55, '8,900 万'], ['FitWorld', 42, '6,500 万'], ['CodeDaily', 30, '4,200 万']].map(([n2, w, v]) => (
              <div key={n2} className="hbar"><span className="hbar-label">{n2}</span><div className="hbar-track"><div className="hbar-fill" style={{ width: w + '%' }}></div></div><span className="hbar-val">{v}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">最近工作流</div>
        {workflows.length === 0
          ? <div className="empty-sm">还没有工作流记录，去内容军师页跑一次</div>
          : workflows.map((x, i) => (
            <div key={i} className="wf-item"><span className="tag tag-ai"><Icon name="zap" />内容军师</span><span className="wf-name">{x.topic}（{x.channel}）</span><span className="wf-meta">{x.time} · 42s</span><span className="tag tag-success">✓</span></div>
          ))}
      </div>
    </section>
  );
}

/* ============ Agent 对话 ============ */
function ChatPage({ setAnalyses, setLast, showToast, goto }) {
  const [messages, setMessages] = useState([
    { kind: 'ai', html: '你好！我是频道分析 Agent。直接告诉我频道名，例如：<b>MrBeast</b>、<b>TechTok</b>、<b>CodeDaily</b>，或者随便输入一个名字试试。<br>我会展示每一步工具调用过程，并给出分析结论 👇' }
  ]);
  const [timeline, setTimeline] = useState([
    { t: '① 解析请求', time: '—', st: 'wait' },
    { t: '② 选择工具', time: '—', st: 'wait' },
    { t: '③ 调用 getChannelStats', time: '—', st: 'wait' },
    { t: '④ 分析生成结论', time: '—', st: 'wait' }
  ]);
  const [ctx, setCtx] = useState([]);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState('');
  const msgsRef = useRef(null);

  useEffect(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, [messages]);

  const tlSet = (idx, st, time) => setTimeline((t) => t.map((x, i) => (i === idx ? { ...x, st, time: time || x.time } : x)));
  const tlReset = () => setTimeline((t) => t.map((x) => ({ ...x, st: 'wait', time: '—' })));

  async function handleSend(raw) {
    const name = String(raw).replace(/@/g, '').replace(/^(分析|看看|查一下|了解|调查)\s*/, '').trim();
    if (!name) { showToast('请告诉我频道名，例如：分析 MrBeast'); return; }
    if (busy) return;
    setBusy(true);
    setMessages((m) => [...m, { kind: 'user', html: esc(raw) }, { kind: 'typing' }]);
    tlReset();
    tlSet(0, 'run'); await wait(400); tlSet(0, 'done', '0.2s');
    tlSet(1, 'run'); await wait(350); tlSet(1, 'done', 'getChannelStats · 0.3s');
    tlSet(2, 'run'); await wait(600);
    let r;
    try { r = await apiAnalyze(name); } catch (e) { const d = makeDemo(name); r = { data: d, real: false, concl: ruleConclusion(d), note: '（静态演示模式）' }; }
    tlSet(2, 'done', '0.8s');
    tlSet(3, 'run'); await wait(500); tlSet(3, 'done', '2.4s');
    const d = r.data || { name, handle: '', subs: '—', views: '—', views30: '—', engage: '—', trend: '—', videos: [] };
    const html = assistantHTML(r, name, d);
    setMessages((m) => [...m.slice(0, -1), { kind: 'ai', html }]);
    setCtx((c) => [...new Set([...c, name])].slice(-6));
    const rec = { name, ts: Date.now(), data: d, real: r.real };
    setAnalyses((a) => [rec, ...a].slice(0, 20));
    setLast(rec);
    setBusy(false);
  }

  const newChat = () => {
    setMessages([{ kind: 'ai', html: '新会话已开始。输入频道名即可分析 👇' }]);
    setCtx([]);
    tlReset();
  };

  return (
    <section className="chat-page">
      <div className="chat-grid">
        <div className="chat-panel">
          <div className="chat-head">
            <span className="chat-title">Agent 对话 · 输入频道名即可分析</span>
            <button className="btn btn-sm btn-secondary" onClick={newChat}><Icon name="plus" />新会话</button>
          </div>
          <div className="messages" ref={msgsRef}>
            {messages.map((m, i) => m.kind === 'user'
              ? <div key={i} className="msg user"><div className="msg-avatar u">你</div><div className="bubble">{m.html}</div></div>
              : m.kind === 'typing'
                ? <div key={i} className="msg"><div className="msg-avatar ai">AI</div><div className="bubble typing"><span className="tdot"></span><span className="tdot"></span><span className="tdot"></span></div></div>
                : <div key={i} className="msg"><div className="msg-avatar ai">AI</div><div className="bubble" dangerouslySetInnerHTML={{ __html: m.html }} /></div>
            )}
          </div>
          <form className="composer" onSubmit={(e) => { e.preventDefault(); if (input.trim()) { setInput(''); handleSend(input); } }}>
            <input name="chat" value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入频道名，如 MrBeast / TechTok / CodeDaily…" autoComplete="off" />
            <button className="send-btn" type="submit" title="发送"><Icon name="send" /></button>
          </form>
          <div className="chips" style={{ marginTop: 8 }}>
            试试：
            {['MrBeast', 'TechTok', 'CodeDaily', '随机新频道'].map((n) => (
              <button key={n} className="chip" onClick={() => handleSend(n)}>{n}</button>
            ))}
          </div>
        </div>

        <div className="context-panel">
          <div className="card context-card">
            <div className="card-title">会话上下文</div>
            <div className="chips">
              {ctx.length === 0 && <span className="chip chip-add">＋ 分析后自动添加</span>}
              {ctx.map((n) => <span key={n} className="chip">🔴 {n}</span>)}
            </div>
          </div>
          <div className="card context-card">
            <div className="card-title">Tool Calling 时间线 <span className="tag tag-ai">实时</span></div>
            <div className="timeline">
              {timeline.map((x, i) => (
                <div key={i} className="timeline-item">
                  <span className={'step-ico ' + x.st}>{x.st === 'done' ? '✓' : x.st === 'run' ? '⟳' : '○'}</span>
                  <div className="t-main"><div className="t-name">{x.t}</div><div className="t-time">{x.time}</div></div>
                </div>
              ))}
            </div>
            <div className="tc-note">AI 的每一步行为都会在这里透明展示</div>
          </div>
          <div className="card context-card">
            <div className="card-title">建议下一步</div>
            <div className="suggest-list">
              <button className="suggest-btn" onClick={() => showToast('⚡ 已跳转内容军师，可生成选题建议')}><span className="s-ico">⚡</span>生成选题建议（内容军师）</button>
              <button className="suggest-btn" onClick={() => showToast('📊 对比图表已生成（演示）')}><span className="s-ico">📊</span>生成对比图表</button>
              <button className="suggest-btn" onClick={() => goto('channel')}><span className="s-ico">📚</span>问视频内容（RAG）</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ 频道洞察 ============ */
function ChannelPage({ last, goto }) {
  const [rag, setRag] = useState({ loading: false, chunks: null, source: null, error: false });
  const [qa, setQa] = useState([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);

  const doIngest = useCallback(async (name) => {
    setRag({ loading: true, chunks: null, source: null, error: false });
    try {
      const r = await apiIngest(name);
      setRag({ loading: false, chunks: r.chunks, source: r.source, error: false });
    } catch (e) {
      setRag({ loading: false, chunks: 3, source: 'demo', error: false });
    }
  }, []);

  useEffect(() => {
    if (last) {
      setQa([]);
      doIngest(last.data.name);
    }
  }, [last, doIngest]);

  async function submitQ(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q || !last || asking) return;
    setAsking(true);
    try {
      const r = await apiAsk(last.data.name, q);
      setQa((list) => [{ q, answer: r.answer, sources: r.sources || [] }, ...list]);
      setQuestion('');
    } catch (err) {
      const dr = demoAsk(last.data.name, q);
      setQa((list) => [{ q, answer: dr.answer + '（静态演示模式）', sources: dr.sources }, ...list]);
    }
    setAsking(false);
  }

  if (!last) {
    return (
      <div className="card empty">
        <div className="e-ico">📡</div>
        <p>还没有分析过频道。去对话页输入一个频道名，结果会自动展示在这里。</p>
        <button className="btn btn-primary" onClick={() => goto('chat')}><Icon name="plus" />去分析一个频道</button>
      </div>
    );
  }
  const d = last.data, real = last.real;
  return (
    <section>
      <div className="channel-head">
        <div className="ch-left">
          <span className="ch-avatar"><Icon name="play" /></span>
          <div>
            <h1>{d.name} <span className={'data-badge ' + (real ? 'real' : 'demo')}>{real ? '真实数据' : '演示数据'}</span></h1>
            <div className="ch-meta">{d.handle}</div>
          </div>
        </div>
        <div className="greet-actions">
          <button className="btn btn-secondary" onClick={() => goto('workflow')}><Icon name="zap" />生成选题建议</button>
          <button className="btn btn-secondary"><Icon name="plus" />加入知识库</button>
        </div>
      </div>

      <div className="stats">
        <div className="stat-card"><span className="stat-label">订阅数</span><span className="stat-value">{d.subs}</span><span className="stat-sub">{real ? 'YouTube API' : '内置演示'}</span></div>
        <div className="stat-card"><span className="stat-label">总播放</span><span className="stat-value">{d.views}</span><span className="stat-sub">累计</span></div>
        <div className="stat-card"><span className="stat-label">近30天播放</span><span className="stat-value">{d.views30}</span><span className="stat-delta">{d.trend}</span></div>
        <div className="stat-card"><span className="stat-label">互动率</span><span className="stat-value">{d.engage}</span><span className="stat-sub">{real ? '近3条视频估算' : '估算'}</span></div>
      </div>

      <div className="grid-2-3">
        <div className="card">
          <div className="card-title">近 30 天数据概览 <span className="tabs"><button className="tab active">30天</button></span></div>
          <svg className="line-chart" viewBox="0 0 560 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity=".28" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="30" x2="560" y2="30" className="grid-l" />
            <line x1="0" y1="60" x2="560" y2="60" className="grid-l" />
            <line x1="0" y1="90" x2="560" y2="90" className="grid-l" />
            <path d="M0,92 L45,86 L90,88 L135,70 L180,64 L225,68 L270,46 L315,42 L360,50 L405,34 L450,28 L495,38 L540,22 L560,24 L560,120 L0,120 Z" fill="url(#gTrend)" />
            <path d="M0,92 L45,86 L90,88 L135,70 L180,64 L225,68 L270,46 L315,42 L360,50 L405,34 L450,28 L495,38 L540,22 L560,24" className="line-main" />
            <circle cx="560" cy="24" r="3.5" fill="var(--brand)" />
          </svg>
          <div className="legend"><span className="lg-item"><span className="lg-dot" style={{ background: 'var(--brand)' }}></span>播放量走势（演示曲线）</span></div>
        </div>
        <div className="card">
          <div className="card-title"><span className="ai-label">🟣</span> AI 内容理解（RAG）</div>
          <p className="ai-desc">基于最近字幕内容理解，频道主题分布：</p>
          <div className="hbars sm">
            {themeBars(d.name).map(([label, pct]) => (
              <div key={label} className="hbar"><span className="hbar-label">{label}</span><div className="hbar-track"><div className="hbar-fill ai-fill" style={{ width: pct + '%' }}></div></div><span className="hbar-val">{pct}%</span></div>
            ))}
          </div>
          <div className="cites"><span className="tag tag-gray">{rag.chunks ? '🔗 已索引 ' + rag.chunks + ' 个字幕片段' : '🔗 引用 ' + (20 + hash(d.name.toLowerCase()) % 40) + ' 段字幕'}</span></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">
          <span>📚 问视频内容（RAG）</span>
          <button className="btn btn-sm btn-ghost" onClick={() => doIngest(last.data.name)}><Icon name="refresh" />重新索引</button>
        </div>
        <div className="empty-sm">
          {rag.loading
            ? '⏳ 正在索引字幕并向量化…'
            : rag.error
              ? '索引失败，请确认后端已启动。'
              : '已索引 ' + rag.chunks + ' 个字幕片段（' + (rag.source === 'real' ? '真实字幕' : '演示字幕') + '），可在下方提问。'}
        </div>
        {qa.map((item, i) => (
          <div key={i}>
            <div className="msg user"><div className="msg-avatar u">你</div><div className="bubble">{item.q}</div></div>
            <div className="msg"><div className="msg-avatar ai">AI</div><div className="bubble">{item.answer}
              {item.sources.length > 0 && (
                <div className="cites">
                  {item.sources.map((s, j) => (
                    <span key={j} className="tag tag-gray">⏱ {s.time} · 《{s.video}》</span>
                  ))}
                </div>
              )}
            </div></div>
          </div>
        ))}
        {qa.length === 0 && <div className="empty-sm">试试问：「视频里送了几辆车？」「这个频道讲了哪些主题？」</div>}
        <form className="composer" onSubmit={submitQ}>
          <input name="rag" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="问视频内容，如：视频里送了几辆车？" autoComplete="off" />
          <button className="send-btn" type="submit" title="提问"><Icon name="send" /></button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-title">最近视频</div>
        <table className="table">
          <thead><tr><th>标题</th><th>播放</th><th>状态</th></tr></thead>
          <tbody>
            {(d.videos || []).map((v, i) => (
              <tr key={i}><td className="td-title">{v.t}</td><td>{v.v}</td><td><span className="tag tag-success">✓ 已分析</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card ai-card" style={{ marginTop: 16 }}>
        <div className="card-title">🟣 AI 分析结论</div>
        <ul className="concl-mini">{ruleConclusion(d).map((t, i) => <li key={i}>{t}</li>)}</ul>
      </div>
    </section>
  );
}

/* ============ 内容军师 ============ */
function WorkflowPage({ analyses, setWorkflows, last, showToast }) {
  const [channel, setChannel] = useState(last ? last.data.name : 'MrBeast');
  const [topic, setTopic] = useState('AI 工具测评');
  const [goal, setGoal] = useState('涨粉');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState('');
  const [steps, setSteps] = useState(['done', 'wait', 'wait', 'wait', 'wait']);
  const names = [...new Set([...analyses.map((a) => a.name), 'MrBeast', 'TechTok', 'CodeDaily', 'MusicLab'])];
  useEffect(() => { if (last) setChannel(last.data.name); }, [last]);

  async function run() {
    if (running) return;
    setRunning(true); setResults('');
    setSteps(['running', 'wait', 'wait', 'wait', 'wait']);
    for (let i = 0; i < 5; i++) {
      setSteps((s) => s.map((x, j) => (j === i ? 'running' : x)));
      await wait(650 + i * 180);
      setSteps((s) => s.map((x, j) => (j === i ? 'done' : x)));
    }
    setResults(genWorkflow(channel, topic, goal));
    setWorkflows((w) => [{ channel, topic, time: ago(Date.now()) }, ...w].slice(0, 10));
    setRunning(false);
    showToast('✅ 内容军师运行完成 · 总耗时 42s');
  }

  const labels = ['① 选题分析', '② 竞品对比', '③ 标题生成', '④ 脚本生成', '⑤ 发布建议'];
  return (
    <section>
      <div className="card">
        <div className="card-title">⚡ 内容军师 · 配置输入</div>
        <div className="wf-config">
          <div className="field grow1"><label>频道选择</label>
            <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
              {names.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="field grow2"><label>主题 / 方向</label><input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
          <div className="field"><label>目标</label>
            <select className="input" value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option>涨粉</option><option>互动率</option><option>变现</option>
            </select>
          </div>
          <div className="field"><label>&nbsp;</label>
            <button className="btn btn-primary" onClick={run} disabled={running}><Icon name="zap" />{running ? '运行中…' : '开始运行'}</button>
          </div>
        </div>
      </div>

      <div className="stepper">
        {steps.map((st, i) => (
          <React.Fragment key={i}>
            {i > 0 && <div className={'conn' + (steps[i - 1] === 'done' ? ' done' : '')}></div>}
            <div className={'step' + (st === 'done' ? ' done' : st === 'running' ? ' running' : '')}>
              <span className="dot">{st === 'done' ? '✓' : st === 'running' ? '⟳' : ''}</span>
              <span className="lbl">{labels[i]}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {results && <div dangerouslySetInnerHTML={{ __html: results }} />}
    </section>
  );
}

/* ============ 跨境电商（选品/看板/脚本/出图） ============ */
function linePath(series, w = 560, h = 120) {
  const max = Math.max(...series), min = Math.min(...series);
  const range = max - min || 1;
  return series.map((v, i) => {
    const x = (i / (series.length - 1)) * w;
    const y = h - 12 - ((v - min) / range) * (h - 24);
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
}

function EcomPage({ showToast }) {
  const tabs = [
    ['pick', '🔍 选品分析'],
    ['board', '📊 数据看板'],
    ['script', '🎬 短视频脚本'],
    ['image', '🖼 AI 出图 Prompt']
  ];
  const [tab, setTab] = useState('pick');

  /* ① 选品分析 */
  const [kw, setKw] = useState('蓝牙耳机');
  const [pick, setPick] = useState(null);
  const [picking, setPicking] = useState(false);
  const doPick = async () => {
    if (!kw.trim() || picking) return;
    setPicking(true); setPick(null);
    try { setPick(await ecomAnalyze(kw)); } catch (e) { setPick(ecomAnalyzeDemo(kw)); }
    setPicking(false);
  };

  /* ② 数据看板：真实数据导入 */
  const [board, setBoard] = useState(null);
  const [csv, setCsv] = useState('');
  const [realBoard, setRealBoard] = useState(null);
  const [analyzingData, setAnalyzingData] = useState(false);
  useEffect(() => { ecomDashboard().then(setBoard).catch(() => {}); }, []);
  const EXAMPLE_CSV = [
    '日期,订单数,流量',
    '5月1日,86,3200', '5月2日,92,3450', '5月3日,71,2890', '5月4日,105,4120',
    '5月5日,118,4600', '5月6日,96,3560', '5月7日,88,3310', '5月8日,102,3980',
    '5月9日,125,4900', '5月10日,131,5120', '5月11日,109,4250', '5月12日,97,3720',
    '5月13日,114,4410', '5月14日,142,5520'
  ].join('\n');
  const loadExample = () => { setCsv(EXAMPLE_CSV); };
  const doAnalyzeData = async () => {
    if (!csv.trim() || analyzingData) return;
    setAnalyzingData(true); setRealBoard(null);
    try { setRealBoard(await ecomData(csv)); } catch (e) {
      try { setRealBoard(ecomDataDemo(csv)); } catch (e2) { showToast('数据解析失败：' + e2.message); }
    }
    setAnalyzingData(false);
  };

  /* ③ 短视频脚本 */
  const [prod, setProd] = useState('蓝牙耳机');
  const [script, setScript] = useState(null);
  const [scriptSteps, setScriptSteps] = useState(['wait', 'wait', 'wait']);
  const [scripting, setScripting] = useState(false);
  const doScript = async () => {
    if (!prod.trim() || scripting) return;
    setScripting(true); setScript(null);
    setScriptSteps(['running', 'wait', 'wait']);
    await wait(600); setScriptSteps(['done', 'running', 'wait']);
    await wait(700); setScriptSteps(['done', 'done', 'running']);
    try { setScript(await ecomScript(prod)); } catch (e) { setScript(ecomScriptDemo(prod)); }
    await wait(500); setScriptSteps(['done', 'done', 'done']);
    setScripting(false);
  };

  /* ④ 出图 Prompt */
  const [iprod, setIprod] = useState('蓝牙耳机');
  const [istyle, setIstyle] = useState('东南亚审美');
  const [prompts, setPrompts] = useState(null);
  const [prompting, setPrompting] = useState(false);
  const doPrompts = async () => {
    if (!iprod.trim() || prompting) return;
    setPrompting(true); setPrompts(null);
    try { setPrompts(await ecomPrompts(iprod, istyle)); } catch (e) { setPrompts(ecomPromptsDemo(iprod, istyle)); }
    setPrompting(false);
  };

  return (
    <section>
      <div className="greet">
        <div><h1>跨境电商 AI 助手</h1><p>选品分析 · 数据看板 · 短视频脚本 · AI 出图 Prompt（演示数据）</p></div>
        <div className="tabs">
          {tabs.map(([k, label]) => (
            <button key={k} className={'tab' + (tab === k ? ' active' : '')} onClick={() => setTab(k)} style={{ height: 30, padding: '0 14px' }}>{label}</button>
          ))}
        </div>
      </div>

      {tab === 'pick' && (
        <div>
          <div className="card">
            <div className="card-title">🔍 AI 跨境选品分析（真实大模型生成） <span className="tag tag-ai">LLM 驱动</span></div>
            <div className="input-row" style={{ display: 'flex', gap: 10 }}>
              <input name="ecom-kw" className="input grow2" value={kw} onChange={(e) => setKw(e.target.value)} aria-label="品类关键词" placeholder="输入品类关键词，如：蓝牙耳机 / 防晒衣 / 手机支架" />
              <button className="btn btn-primary" onClick={doPick} disabled={picking}><Icon name="zap" />{picking ? '分析中…' : '开始分析'}</button>
            </div>
            <div className="chips" style={{ marginTop: 10 }}>
              试试：
              {['蓝牙耳机', '防晒衣', '手机支架', '美甲贴'].map((k) => (
                <button key={k} className="chip" onClick={() => { setKw(k); }}>{k}</button>
              ))}
            </div>
          </div>

          {pick && pick.source === 'llm' && (
            <div style={{ marginTop: 16 }}>
              <div className="card">
                <div className="card-title">🤖 AI 选品分析报告（真实大模型生成） <span className="tag tag-success">真实 AI</span></div>
                <div className="ai-desc">{pick.report.summary}</div>
                <div className="options">
                  <div className="opt"><span className="tag tag-ai">机会</span><div className="opt-main">{pick.report.opportunities.map((o, i) => <div key={i}>· {o}</div>)}</div></div>
                  <div className="opt"><span className="tag tag-warn">风险</span><div className="opt-main">{pick.report.risks.map((r, i) => <div key={i}>· {r}</div>)}</div></div>
                  <div className="opt"><span className="tag tag-gray">定价建议</span><div className="opt-main">{pick.report.pricing}</div></div>
                  <div className="opt"><span className="tag tag-brand">平台打法</span><div className="opt-main">{pick.report.platforms.map((p, i) => <div key={i}>· {p.name}：{p.strategy}</div>)}</div></div>
                  <div className="opt"><span className="tag tag-ai">关联关键词</span><div className="opt-main">{pick.report.keywords.join('、')}</div></div>
                </div>
                <button className="btn btn-secondary w100" style={{ marginTop: 12 }} data-toast="选品报告已导出（演示）"><Icon name="download" />导出选品报告</button>
              </div>
            </div>
          )}
          {pick && pick.source !== 'llm' && (
            <div style={{ marginTop: 16 }}>
              <div className="card">
                <div className="card-title">📈 东南亚市场趋势（近 12 个月指数） <span className="tag tag-gray">{pick.region}</span> <span className="tag tag-warn">演示数据</span></div>
                <svg className="line-chart" viewBox="0 0 560 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gEcom" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand)" stopOpacity=".28" />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="30" x2="560" y2="30" className="grid-l" />
                  <line x1="0" y1="60" x2="560" y2="60" className="grid-l" />
                  <line x1="0" y1="90" x2="560" y2="90" className="grid-l" />
                  <path d={'M' + linePath(pick.market.series) + ' L560,120 L0,120 Z'} fill="url(#gEcom)" />
                  <path d={'M' + linePath(pick.market.series)} className="line-main" />
                </svg>
                <div className="legend">
                  <span className="lg-item"><span className="lg-dot" style={{ background: 'var(--brand)' }}></span>市场指数</span>
                  <span className="lg-item">同比增长 <b className="up">+{pick.market.growth}</b></span>
                  <span className="lg-item">市场规模 <b>{pick.market.size}</b></span>
                </div>
              </div>

              <div className="grid-2" style={{ marginTop: 16 }}>
                <div className="card">
                  <div className="card-title">平台表现</div>
                  <div className="hbars">
                    {pick.platforms.map((p) => (
                      <div key={p.name} className="hbar"><span className="hbar-label">{p.name}</span><div className="hbar-track"><div className="hbar-fill" style={{ width: (20 + (parseFloat(p.sales) || 5) * 2.6) + '%' }}></div></div><span className="hbar-val">{p.sales} · {p.growth}</span></div>
                    ))}
                  </div>
                  <div className="cites" style={{ marginTop: 10 }}>
                    <span className="tag tag-gray">竞争度：{pick.competition.level}</span>
                    <span className="tag tag-gray">在售卖家 {pick.competition.sellers}</span>
                    <span className="tag tag-gray">广告成本 {pick.competition.adCost}</span>
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">AI 选品建议</div>
                  <ul className="concl-mini">{pick.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  <button className="btn btn-secondary w100" style={{ marginTop: 8 }} data-toast="选品报告已导出（演示）"><Icon name="download" />导出选品报告</button>
                </div>
              </div>

              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-title">🔥 平台爆款参考（Top 5）</div>
                <table className="table">
                  <thead><tr><th>产品</th><th>价格</th><th>销量</th><th>增速</th><th>竞争</th></tr></thead>
                  <tbody>
                    {pick.topProducts.map((p, i) => (
                      <tr key={i}><td className="td-title">{p.name}</td><td>{p.price}</td><td>{p.sales}</td><td className="up">{p.growth}</td><td><span className={'tag ' + (p.competition === '低' ? 'tag-success' : p.competition === '中' ? 'tag-warn' : 'tag-gray')}>{p.competition}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'board' && (
        <div>
          <div className="card">
            <div className="card-title">📥 导入你的真实数据（CSV） <span className="tag tag-success">真实统计</span></div>
            <textarea className="input mono" style={{ height: 110, paddingTop: 8, resize: 'none' }} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={'每行：日期,订单数,流量\n例：5月1日,86,3200'} />
            <div className="chips" style={{ marginTop: 8 }}>
              <button className="btn btn-sm btn-secondary" onClick={loadExample}><Icon name="plus" />载入示例数据</button>
              <button className="btn btn-sm btn-primary" onClick={doAnalyzeData} disabled={analyzingData}><Icon name="zap" />{analyzingData ? '分析中…' : '分析我的数据'}</button>
            </div>
            <div className="hint" style={{ marginTop: 8 }}>粘贴 Shopee / TikTok Shop / Lazada 后台导出的订单、流量数据，格式「日期,数值」即可；AI 洞察由真实大模型生成</div>
          </div>

          {realBoard && (
            <div style={{ marginTop: 16 }}>
              <div className="stats">
                <div className="stat-card"><span className="stat-label">总订单</span><span className="stat-value">{realBoard.stats.totalOrders}</span><span className="stat-sub">{realBoard.stats.days} 天</span></div>
                <div className="stat-card"><span className="stat-label">日均订单</span><span className="stat-value">{realBoard.stats.avgOrders}</span><span className="stat-sub">真实计算</span></div>
                <div className="stat-card"><span className="stat-label">峰值日</span><span className="stat-value">{realBoard.stats.peak.value}</span><span className="stat-sub">{realBoard.stats.peak.label}</span></div>
                <div className="stat-card"><span className="stat-label">首尾趋势</span><span className="stat-value">{realBoard.stats.trend > 0 ? '+' : ''}{realBoard.stats.trend}%</span><span className={'stat-' + (realBoard.stats.trend >= 0 ? 'delta' : 'sub')}>{realBoard.stats.trend >= 0 ? '上升' : '下降'}</span></div>
              </div>
              <div className="card">
                <div className="card-title">📈 你的订单数据趋势 <span className="tag tag-success">真实数据</span></div>
                <svg className="line-chart" viewBox="0 0 560 120" preserveAspectRatio="none">
                  <defs><linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand)" stopOpacity=".28" /><stop offset="100%" stopColor="var(--brand)" stopOpacity="0" /></linearGradient></defs>
                  <line x1="0" y1="30" x2="560" y2="30" className="grid-l" /><line x1="0" y1="60" x2="560" y2="60" className="grid-l" /><line x1="0" y1="90" x2="560" y2="90" className="grid-l" />
                  <path d={'M' + linePath(realBoard.series.map((r) => r.n1)) + ' L560,120 L0,120 Z'} fill="url(#gReal)" />
                  <path d={'M' + linePath(realBoard.series.map((r) => r.n1))} className="line-main" />
                </svg>
              </div>
              {realBoard.summary && (
                <div className="card ai-card" style={{ marginTop: 16 }}>
                  <div className="card-title">🤖 AI 洞察（真实大模型） <span className="tag tag-success">真实 AI</span></div>
                  <ul className="concl-mini">{realBoard.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {!realBoard && board && (
            <div style={{ marginTop: 16 }}>
              <div className="banner">下面为<b>示例数据</b>看板（演示结构）。粘贴你自己的数据后即为真实统计。</div>
              <div className="stats">
                <div className="stat-card"><span className="stat-label">近 30 天营收</span><span className="stat-value">{board.stats.revenue}</span><span className="stat-sub">演示数据</span></div>
                <div className="stat-card"><span className="stat-label">订单量</span><span className="stat-value">{board.stats.orders}</span><span className="stat-sub">TikTok Shop + Shopee + Lazada</span></div>
                <div className="stat-card"><span className="stat-label">转化率</span><span className="stat-value">{board.stats.conv}</span><span className="stat-sub">行业均值 2.8%</span></div>
                <div className="stat-card"><span className="stat-label">广告 ROAS</span><span className="stat-value">{board.stats.adRoas}</span><span className="stat-sub">盈亏线 3.0x</span></div>
              </div>
              <div className="grid-2">
                <div className="card">
                  <div className="card-title">订单量趋势（近 30 天）</div>
                  <svg className="line-chart" viewBox="0 0 560 120" preserveAspectRatio="none">
                    <defs><linearGradient id="gOrd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--ai)" stopOpacity=".28" /><stop offset="100%" stopColor="var(--ai)" stopOpacity="0" /></linearGradient></defs>
                    <line x1="0" y1="30" x2="560" y2="30" className="grid-l" /><line x1="0" y1="60" x2="560" y2="60" className="grid-l" /><line x1="0" y1="90" x2="560" y2="90" className="grid-l" />
                    <path d={'M' + linePath(board.orders) + ' L560,120 L0,120 Z'} fill="url(#gOrd)" />
                    <path d={'M' + linePath(board.orders)} className="line-comp" />
                  </svg>
                </div>
                <div className="card">
                  <div className="card-title">流量趋势（近 30 天）</div>
                  <svg className="line-chart" viewBox="0 0 560 120" preserveAspectRatio="none">
                    <defs><linearGradient id="gTra" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand)" stopOpacity=".28" /><stop offset="100%" stopColor="var(--brand)" stopOpacity="0" /></linearGradient></defs>
                    <line x1="0" y1="30" x2="560" y2="30" className="grid-l" /><line x1="0" y1="60" x2="560" y2="60" className="grid-l" /><line x1="0" y1="90" x2="560" y2="90" className="grid-l" />
                    <path d={'M' + linePath(board.traffic) + ' L560,120 L0,120 Z'} fill="url(#gTra)" />
                    <path d={'M' + linePath(board.traffic)} className="line-main" />
                  </svg>
                </div>
              </div>
              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-title">竞品对比</div>
                <table className="table">
                  <thead><tr><th>店铺</th><th>价格</th><th>月销</th><th>评分</th><th>差距分析</th></tr></thead>
                  <tbody>
                    {board.competitors.map((c, i) => (
                      <tr key={i}><td className="td-title">{c.name}</td><td>{c.price}</td><td>{c.sales}</td><td>⭐ {c.rating}</td><td>{c.gap}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {!realBoard && !board && <div className="empty-sm">看板数据加载中…</div>}
        </div>
      )}

      {tab === 'script' && (
        <div>
          <div className="card">
            <div className="card-title">🎬 短视频脚本工作流（TikTok / Shopee 带货视频） <span className="tag tag-warn">演示数据</span></div>
            <div className="input-row" style={{ display: 'flex', gap: 10 }}>
              <input name="ecom-prod" className="input grow2" value={prod} onChange={(e) => setProd(e.target.value)} aria-label="产品名" placeholder="输入产品名，如：蓝牙耳机" />
              <button className="btn btn-primary" onClick={doScript} disabled={scripting}><Icon name="zap" />{scripting ? '生成中…' : '生成脚本'}</button>
            </div>
            <div className="stepper" style={{ marginTop: 20 }}>
              {scriptSteps.map((st, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className={'conn' + (scriptSteps[i - 1] === 'done' ? ' done' : '')}></div>}
                  <div className={'step' + (st === 'done' ? ' done' : st === 'running' ? ' running' : '')}>
                    <span className="dot">{st === 'done' ? '✓' : st === 'running' ? '⟳' : ''}</span>
                    <span className="lbl">{['分析卖点', '生成脚本', '优化文案'][i]}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {script && (
            <div style={{ marginTop: 16 }}>
              <div className="result-card">
                <div className="result-head"><span className="result-title">🎬 视频脚本（{script.product}） {script.source === 'llm' ? <span className="tag tag-success">真实 AI</span> : <span className="tag tag-warn">演示</span>}</span><button className="btn btn-sm btn-ghost" data-copy={script.hook + '\n' + script.body.join('\n') + '\n' + script.cta}><Icon name="copy" />复制脚本</button></div>
                <div className="opt"><span className="opt-no">1</span><div className="opt-main"><b>开头钩子（0-3s）</b><div className="opt-sub">{script.hook}</div></div></div>
                <div className="opt"><span className="opt-no">2</span><div className="opt-main"><b>正文三幕</b><div className="opt-sub">{script.body.map((b, i) => <div key={i}>· {b}</div>)}</div></div></div>
                <div className="opt"><span className="opt-no">3</span><div className="opt-main"><b>结尾 CTA</b><div className="opt-sub">{script.cta}</div></div></div>
              </div>
              <div className="result-card">
                <div className="result-head"><span className="result-title">✏️ 标题 / 文案 / 标签</span><button className="btn btn-sm btn-ghost" data-toast="已复制标题（演示）"><Icon name="copy" />复制全部</button></div>
                <div className="options">
                  {script.titles.map((t, i) => (
                    <div key={i} className="opt"><span className="tag tag-ai">A{i + 1}</span><div className="opt-main"><b>{t}</b></div></div>
                  ))}
                  <div className="opt"><span className="tag tag-gray">描述</span><div className="opt-main">{script.caption}</div></div>
                  <div className="opt"><span className="tag tag-gray">标签</span><div className="opt-main">{script.hashtags.join(' ')}</div></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'image' && (
        <div>
          <div className="card">
            <div className="card-title">🖼 AI 出图 Prompt 工作台（主图 / 详情页 / 场景图 / 广告图 / 社媒图） <span className="tag tag-warn">演示数据</span></div>
            <div className="wf-config">
              <div className="field grow2"><label htmlFor="ecom-img-prod">产品</label><input id="ecom-img-prod" name="ecom-img-prod" className="input" value={iprod} onChange={(e) => setIprod(e.target.value)} /></div>
              <div className="field grow1"><label htmlFor="ecom-style">风格</label>
                <select id="ecom-style" name="ecom-style" className="input" value={istyle} onChange={(e) => setIstyle(e.target.value)}>
                  <option>东南亚审美</option><option>高级简约</option><option>活力潮流</option><option>温馨生活</option>
                </select>
              </div>
              <div className="field"><label>&nbsp;</label><button className="btn btn-primary" onClick={doPrompts} disabled={prompting}><Icon name="zap" />{prompting ? '生成中…' : '生成 Prompt'}</button></div>
            </div>
            <div className="hint" style={{ marginTop: 8 }}>适配 TikTok Shop / Shopee / Lazada 平台规范，生成后可复制到任意 AI 绘图工具（Midjourney / 即梦 / 通义万相等）</div>
          </div>

          {prompts && (
            <div className="result-card" style={{ marginTop: 16 }}>
              <div className="result-head"><span className="result-title">🖼 出图 Prompt（{prompts.product} · {prompts.style}） {prompts.source === 'llm' ? <span className="tag tag-success">真实 AI</span> : <span className="tag tag-warn">演示</span>}</span><button className="btn btn-sm btn-ghost" data-toast="全部 Prompt 已复制（演示）"><Icon name="copy" />复制全部</button></div>
              <div className="options">
                {[['主图', prompts.main], ['详情页', prompts.detail], ['场景图', prompts.scene], ['广告图', prompts.ad], ['社媒图', prompts.social]].map(([label, text]) => (
                  <div key={label} className="opt">
                    <span className="tag tag-ai">{label}</span>
                    <div className="opt-main"><span style={{ color: 'var(--text-2)' }}>{text}</span>
                      <div className="opt-sub"><button className="link-more" data-copy={text}>复制此 Prompt</button></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ============ 设置 ============ */
function SettingsPage({ keys, setKeys, showToast, theme, setTheme }) {
  const [yt, setYt] = useState('');
  const [llm, setLlm] = useState('');
  const [conn, setConn] = useState(null);
  const [testing, setTesting] = useState(false);
  useEffect(() => { setYt(''); setLlm(''); }, [keys]);

  const save = async () => {
    try {
      const r = await saveConfig(yt.trim(), llm.trim());
      setKeys({ ytKey: r.hasYt ? '已配置' : '', llmKey: r.hasLlm ? '已配置' : '' });
      showToast('Key 已保存到服务端（本机）');
    } catch (e) { showToast('保存失败：' + e.message); }
  };

  const test = async () => {
    setTesting(true); setConn(null);
    try {
      setConn(await apiTestConnection());
    } catch (e) { setConn({ yt: 'error', llm: 'error' }); }
    setTesting(false);
  };
  const statusText = (s) => s === 'ok' ? '✓ 有效' : s === 'invalid' ? '✗ 无效' : s === 'not-configured' ? '未配置' : '连接错误';
  const statusClass = (s) => s === 'ok' ? 'tag-success' : s === 'invalid' ? 'tag-warn' : 'tag-gray';

  return (
    <section>
      <div className="greet"><div><h1>设置</h1><p>模型、密钥与数据源管理</p></div></div>
      <div className="banner">当前为<b>演示数据</b>，用于先跑通流程。在下方填入 YouTube Data API Key 后自动改用真实数据；填 LLM Key 后分析结论由真实大模型生成。Key 只保存在本机。</div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="card-title">模型</div>
          <div className="field"><label>默认模型</label>
            <select className="input"><option>DeepSeek-V3（开发期）</option><option>Claude 4.5 Sonnet</option><option>GPT-4.1</option></select>
          </div>
          <div className="field"><label>Temperature <span className="hint">0.7 · 创意与稳定平衡</span></label><input type="range" min="0" max="1" step="0.1" defaultValue="0.7" className="range" /></div>
          <div className="hint">开发期建议低成本模型，生产环境可切换顶级模型</div>
        </div>

        <div className="card">
          <div className="card-title">API Key</div>
          <div className="field"><label>YouTube Data API</label><input className="input" value={yt} onChange={(e) => setYt(e.target.value)} placeholder={keys.ytKey ? '已配置 · 粘贴新 Key 可覆盖' : '粘贴 YouTube Data API Key'} /></div>
          <div className="field"><label>LLM API Key（可选）</label><input className="input" value={llm} onChange={(e) => setLlm(e.target.value)} placeholder={keys.llmKey ? '已配置 · 粘贴新 Key 可覆盖' : '粘贴 LLM Key，如 DeepSeek'} /></div>
          <button className="btn btn-secondary" onClick={save}><Icon name="check" />保存到服务端</button>
          <div className="field" style={{ marginTop: 10 }}>
            <button className="btn btn-secondary" onClick={test} disabled={testing}><Icon name="refresh" />{testing ? '测试中…' : '测试连接'}</button>
          </div>
          {conn && (
            <div className="cites" style={{ marginTop: 4 }}>
              <span className={'tag ' + statusClass(conn.yt)}>YouTube：{statusText(conn.yt)}</span>
              <span className={'tag ' + statusClass(conn.llm)}>LLM：{statusText(conn.llm)}</span>
            </div>
          )}
          <div className="hint" style={{ marginTop: 10 }}>申请教程见项目 docs/api-keys-guide.md</div>
        </div>

        <div className="card">
          <div className="card-title">MCP <span className="tag tag-success">● 就绪</span></div>
          <div className="field"><label>协议</label><input className="input mono" value="stdio（标准 Model Context Protocol）" readOnly /></div>
          <div className="field"><label>启动命令</label><input className="input mono" value="node server/mcp-server.js" readOnly /></div>
          <div className="field"><label>Claude Desktop 配置（复制到 claude_desktop_config.json）</label>
            <textarea className="input mono" style={{ height: 118, paddingTop: 8, resize: 'none' }} readOnly value={'{\n  "mcpServers": {\n    "tubeinsight": {\n      "command": "node",\n      "args": ["D:/Test02/server/mcp-server.js"]\n    }\n  }\n}'} />
          </div>
          <button className="btn btn-secondary" data-copy='{"mcpServers":{"tubeinsight":{"command":"node","args":["D:/Test02/server/mcp-server.js"]}}}'><Icon name="copy" />复制配置</button>
          <div className="hint" style={{ marginTop: 10 }}>暴露 3 个工具：analyze_channel / ask_video_content / generate_ideas</div>
        </div>

        <div className="card">
          <div className="card-title">通用</div>
          <div className="field"><label>主题</label>
            <select className="input" value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="dark">深色</option><option value="light">浅色</option>
            </select>
          </div>
          <div className="field"><label>语言</label>
            <select className="input" onChange={() => showToast('🌐 语言切换（演示）')}><option>简体中文</option><option>English</option></select>
          </div>
          <button className="btn btn-danger-ghost" onClick={() => { localStorage.removeItem('ti_analyses'); localStorage.removeItem('ti_workflows'); window.location.reload(); }}><Icon name="trash" />清空本地数据（分析记录）</button>
        </div>
      </div>
    </section>
  );
}
