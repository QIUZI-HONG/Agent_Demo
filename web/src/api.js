/* TubeInsight 前端 API 封装 */

async function api(path, options = {}) {
  const r = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || '请求失败');
  return j;
}

export const analyze = (name) =>
  api('/api/analyze', { method: 'POST', body: JSON.stringify({ name }) });

export const ingest = (name) =>
  api('/api/ingest', { method: 'POST', body: JSON.stringify({ name }) });

export const ask = (name, question) =>
  api('/api/ask', { method: 'POST', body: JSON.stringify({ name, question }) });

export const saveConfig = (ytKey, llmKey) =>
  api('/api/config', { method: 'POST', body: JSON.stringify({ ytKey, llmKey }) });

export const testConnection = () =>
  api('/api/test-connection', { method: 'POST', body: JSON.stringify({}) });

/* ---------- 跨境电商 ---------- */
export const ecomAnalyze = (keyword) =>
  api('/api/ecom/analyze', { method: 'POST', body: JSON.stringify({ keyword }) });

export const ecomDashboard = () => api('/api/ecom/dashboard');

export const ecomScript = (product) =>
  api('/api/ecom/script', { method: 'POST', body: JSON.stringify({ product }) });

export const ecomPrompts = (product, style) =>
  api('/api/ecom/prompts', { method: 'POST', body: JSON.stringify({ product, style }) });

export const ecomData = (data) =>
  api('/api/ecom/data', { method: 'POST', body: JSON.stringify({ data }) });

export const getConfig = () => api('/api/config');
