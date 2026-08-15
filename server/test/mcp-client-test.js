'use strict';
/* ============================================================
   MCP 客户端测试（不依赖 SDK，裸 JSON-RPC over stdio）
   验证：initialize → tools/list → tools/call 全流程
   运行：node test/mcp-client-test.js
   ============================================================ */
const { spawn } = require('child_process');
const path = require('path');

const child = spawn(process.execPath, [path.join(__dirname, '..', 'mcp-server.js')], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let buf = '';
const pending = new Map(); // id -> resolve
let nextId = 0;

function send(method, params, id) {
  const msg = { jsonrpc: '2.0', method, params };
  if (id !== undefined) { msg.id = id; }
  child.stdin.write(JSON.stringify(msg) + '\n');
  if (id !== undefined) {
    return new Promise((resolve) => pending.set(id, resolve));
  }
  return Promise.resolve();
}

child.stdout.on('data', (chunk) => {
  buf += chunk.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch (e) { continue; }
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  try {
    // 1. initialize
    const init = await send('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'tubeinsight-test', version: '1.0' }
    }, nextId++);
    console.log('[1] initialize OK ->', JSON.stringify(init.result.serverInfo));
    console.log('[1] protocolVersion ->', init.result.protocolVersion);
    send('notifications/initialized', {});

    // 2. tools/list
    const list = await send('tools/list', {}, nextId++);
    const tools = list.result.tools.map((t) => t.name);
    console.log('[2] tools/list ->', tools.join(', '));

    // 3. tools/call analyze_channel
    const a = await send('tools/call', {
      name: 'analyze_channel',
      arguments: { name: 'MrBeast' }
    }, nextId++);
    const aText = a.result.content[0].text;
    const aData = JSON.parse(aText);
    console.log('[3] analyze_channel -> real=' + aData.real_data + ' subs=' + aData.subs + ' conclusion=' + aData.conclusion.length + ' 条');

    // 4. tools/call ask_video_content（自动索引 + RAG 问答）
    const q = await send('tools/call', {
      name: 'ask_video_content',
      arguments: { channel: 'MrBeast', question: '给流浪汉买了什么？' }
    }, nextId++);
    const qData = JSON.parse(q.result.content[0].text);
    console.log('[4] ask_video_content -> ' + qData.answer.slice(0, 60) + '…  sources=' + qData.sources.length + ' 条');

    // 5. tools/call generate_ideas
    const g = await send('tools/call', {
      name: 'generate_ideas',
      arguments: { channel: 'MrBeast', topic: 'AI 工具测评', goal: '涨粉' }
    }, nextId++);
    const gData = JSON.parse(g.result.content[0].text);
    console.log('[5] generate_ideas -> ideas=' + gData.ideas.length + ' titles=' + gData.titles.length);

    console.log('=== ALL MCP TESTS PASSED ===');
    child.kill();
    process.exit(0);
  } catch (e) {
    console.error('MCP TEST FAILED:', e);
    child.kill();
    process.exit(1);
  }
})();

setTimeout(() => {
  console.error('MCP TEST TIMEOUT');
  child.kill();
  process.exit(1);
}, 30000);
