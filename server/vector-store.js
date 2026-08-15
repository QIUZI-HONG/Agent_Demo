'use strict';
/* ============================================================
   极简向量库（零第三方依赖）
   - 嵌入：哈希特征向量（英文词 + 中文 2-gram），L2 归一化
   - 检索：余弦相似度 Top-K
   - 存储：JSON 文件（server/data/vector-store.json）
   ============================================================ */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'vector-store.json');
const DIM = 256;

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* 特征：英文/数字词 + 中文 2-gram + 中文单字（对短查询更友好） */
function grams(text) {
  const s = String(text).toLowerCase();
  const out = [];
  const words = s.match(/[a-z0-9]+/g) || [];
  for (const w of words) out.push(w);
  const cjk = s.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+/g) || [];
  for (const run of cjk) {
    if (run.length === 1) out.push(run);
    else {
      for (let i = 0; i < run.length; i++) out.push(run[i]);           // 单字
      for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2)); // 2-gram
    }
  }
  return out;
}

function embed(text) {
  const vec = new Array(DIM).fill(0);
  for (const g of grams(text)) {
    const h = hashStr(g);
    vec[h % DIM] += (h & 0x800) ? -1 : 1;
  }
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => v / norm);
}

function cosine(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function load() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch (e) { return { chunks: [] }; }
}

function save(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db));
}

/* 搜索：channel 传 null 表示全库 */
function search(db, q, channel, k = 3) {
  const qv = embed(q);
  return db.chunks
    .filter((c) => !channel || c.channel === channel)
    .map((c) => ({ c, score: cosine(qv, c.vec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .filter((r) => r.score > 0.02)
    .map((r) => ({ score: r.score, id: r.c.id, channel: r.c.channel, video: r.c.video, time: r.c.time, text: r.c.text }));
}

/* 覆盖式写入某频道的全部片段 */
function upsertChannel(db, channel, items) {
  db.chunks = db.chunks.filter((c) => c.channel !== channel);
  let id = db.chunks.length;
  for (const it of items) {
    db.chunks.push({ id: id++, channel, video: it.video, time: it.time, text: it.text, vec: embed(it.text) });
  }
  return db;
}

function count(db, channel) {
  return db.chunks.filter((c) => c.channel === channel).length;
}

module.exports = { load, save, search, upsertChannel, count, embed, grams, hashStr, DIM };
