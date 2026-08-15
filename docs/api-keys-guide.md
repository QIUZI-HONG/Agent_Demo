# API Key 申请与配置指南

本项目需要两个 Key（都可以免费申请 / 低成本使用）：

| Key | 必要？ | 用途 | 成本 |
|---|---|---|---|
| **YouTube Data API Key** | 必需（要真实数据就靠它） | 拉取频道/视频真实数据 + 真实字幕 | 免费（每天 1 万配额，个人测试够用） |
| **LLM API Key**（如 DeepSeek） | 可选（强烈建议） | AI 结论 / RAG 回答由真实大模型生成 | 约几毛钱～几块钱够测试很久 |

> 不填任何 Key：项目用内置演示数据，流程完整可跑（当前状态）。
> 只填 YouTube Key：频道数据变真实，AI 结论用规则生成。
> 两个都填：全部真实 —— 数据真实 + 结论真实 + 问答真实。

---

## 一、申请 YouTube Data API Key（约 5 分钟）

1. 打开 **https://console.cloud.google.com**，用你的 Google 账号登录
2. 顶部下拉**新建项目**（命名随意，如 `tubeinsight`），点击创建
3. 左侧菜单 **「APIs & Services（API 和服务）」→「Library（库）」**
4. 搜索框输入 **YouTube Data API v3** → 点进去 → 点 **Enable（启用）**
5. 左侧 **「Credentials（凭据）」→ 顶部「+ Create Credentials（创建凭据）」→「API key（API 密钥）」**
6. 弹窗里会出现一串以 **`AIzaSy`** 开头的字符串 —— **这就是你的 Key，复制保存**

> 建议顺手做两步（可选但推荐）：
> - 点 Key 右侧编辑铅笔 → 「API restrictions」选择 **YouTube Data API v3**（防止 Key 被滥用）
> - 「Application restrictions」选 None（本地用不用限制）

---

## 二、申请 DeepSeek LLM Key（约 3 分钟，可选）

1. 打开 **https://platform.deepseek.com** → 注册 / 登录
2. 左侧 **「API Keys」→ 点「创建 API Key」**
3. 复制生成的以 **`sk-`** 开头的字符串 —— **这就是你的 LLM Key**
4. 左侧 **「充值」**：最低充 ¥10 即可（一次分析约 0.001 元，¥10 能测很久）

> 其他兼容 OpenAI 协议的平台也可以（如 OpenAI、智谱、通义），只需在启动时改环境变量 `LLM_API_BASE` 和 `LLM_MODEL`。

---

## 三、把 Key 填进项目（二选一）

### 方式 A：网页设置页（推荐，最简单）
1. 双击 `start.bat` 启动 → 打开 http://localhost:3000
2. 左下角 **「设置」→「API Key」** 卡片
3. 粘贴两个 Key → 点 **「保存到服务端」**
4. 点 **「测试连接」**，看到两个「✓ 有效」就成功了

### 方式 B：环境变量（适合命令行启动）
```bash
# Windows PowerShell（启动前执行）
$env:YT_KEY='你的YouTubeKey'
$env:LLM_KEY='你的DeepSeekKey'
cd server
node server.js
```
> 方式 A 的 Key 存在后端内存（重启后需重填）；方式 B 的 Key 每次启动都生效。
> 想持久化：把上面两行写进 `server/start-with-keys.bat` 或系统环境变量。

---

## 四、怎么确认生效了

| 现象 | 说明 |
|---|---|
| 分析后标签显示 **「真实数据」**（绿） | ✅ YouTube Key 生效 |
| AI 结论不再是以「建议下一步」结尾的固定模板 | ✅ LLM Key 生效 |
| 频道页 RAG 显示 **「真实字幕」** | ✅ 该频道有公开字幕且抓取成功 |
| 显示 **「真实 API 调用失败，回退演示数据」** | ⚠️ Key 无效 / 网络不通 / 配额耗尽，自动回退，不中断 |

## 五、常见问题

- **Key 无效**：检查是否多复制了空格 / 是否 `AIzaSy` 完整 / Google Cloud 项目是否启用了 API
- **配额不足**：YouTube 免费额度每天 1 万单位，一次分析约 200 单位；超了等第二天或检查用量
- **某些频道没有字幕**：YouTube 未给该视频生成字幕 → 自动回退演示字幕，页面有标注
- **想换 LLM 平台**：启动时设置 `LLM_API_BASE=https://api.xxx.com`、`LLM_MODEL=模型名`
