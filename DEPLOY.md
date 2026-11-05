# 博客更新指南

「财税笔记」个人博客，Astro 6 静态站。本文是**给人看**的操作手册；给 AI 助手的完整契约（远端拓扑、构建校验、已知坑）见 [AGENTS.md](./AGENTS.md)。

> 一句话流程：**本地改 → push 内网 Gitea（自动构建部署 NAS）→ 验证 → push GitHub（公网发布）**

---

## 环境

| 项 | 值 |
|---|---|
| 仓库 | `E:/001vscode/blog/workspace.io` |
| Node | 22.x（CI 同版本） |
| 构建产物 | `dist/`（已 gitignore，不要提交） |

```bash
cd "E:/001vscode/blog/workspace.io"
npm install        # 首次
npm run dev        # http://localhost:4321/workspace.io/
```

---

## 发布流程

### 1. 本地预检

```bash
npm run build
```

要看到 `Complete`、无 error。有错先修，别推上去让 CI 报错。

### 2. 推内网（自动构建并部署到 NAS）

```bash
git add -A
git commit -m "更新说明"
git push
```

`git push` 只会推到内网 Gitea（`origin` → `192.168.5.189:2222`），触发 `.gitea/workflows/deploy.yml`：拉代码 → `npm ci` → 构建 → 同步到 `/volume1/web/workspace.io` → HTTP 自检。大约 1–3 分钟。

预览：**http://192.168.5.189/workspace.io/**

### 3. 验证

```bash
for p in "" "blog/" "about/" "rss.xml"; do
  printf "%-10s " "/$p"
  curl -s -o /dev/null -w "%{http_code}\n" "http://192.168.5.189/workspace.io/$p"
done
```

全 200 之后，**打开页面确认是新内容**——HTTP 200 只能说明文件在，不代表是最新版。

### 4. 推公网

确认没问题后再执行：

```bash
git push github main
```

公网地址 **https://accountder.github.io/workspace.io/**，约 40 秒生效（GitHub Pages 走 CDN，偶尔先 503，等半分钟）。

> ⚠️ **`git push` 不会推 GitHub。** 公网发布必须单独跑 `git push github main`，这是本仓库最容易漏的一步。

---

## 写文章

一篇文章一个目录：`src/content/blog/<slug>/<文件名>.md`，图片放同目录。

```markdown
---
title: '文章标题'
description: '一句话摘要'
pubDate: 'May 25 2026'
heroImage: './banner.png'
category: '财税自动化'
tags: ['Automa', '数电票']
---

正文从 ## 开始写。
```

四条硬规则：

1. **正文不要写 `# 一级标题`** —— 标题由页面渲染，重复会出现两个 h1
2. **正文不要再插 heroImage 那张图** —— 会同一张图连出两次
3. **不要写 mermaid** —— 没有渲染器，会以源码形式暴露；流程图用 `.flow` 结构
4. **保存为 UTF-8 无 BOM**

`category` 取值决定标签配色，定义在 `src/lib/site.ts`。新增分类记得同步配色，否则标签会掉成灰色。

---

## 改样式

设计变量集中在 `src/styles/global.css`：容器（720 正文 / 1120 列表）、4px 基数间距、三种圆角、两级阴影、语义颜色。

- 颜色只用 `var(--text)` / `var(--bg-card)` / `var(--border)` 这类变量，**别写死色值**，否则暗色模式会崩
- 不要加 `html * { transition }`，全页重绘会很卡
- 代码块是亮/暗双 Shiki 主题，改样式时两套都要看

---

## 目录结构

```
src/
├── assets/fonts/        # 字体
├── components/          # Header / Footer / BaseHead / PostCover ...
├── content/blog/        # 文章，一目录一篇
├── layouts/BlogPost.astro  # 文章页（TOC、进度条、代码复制）
├── lib/site.ts          # 分类配色、阅读时长、日期格式化
├── pages/               # index / about / 404 / blog/ / rss.xml.js
└── styles/global.css    # 设计 token + 全局样式
scripts/collect-infra.js # NAS 容器配置采集（用完删产物）
.gitea/workflows/        # 内网构建部署
.github/workflows/       # 公网 GitHub Pages
```

---

## 出问题先看这里

| 现象 | 原因 |
|---|---|
| 公网还是旧版 | 忘了 `git push github main` |
| 改了文档没触发构建 | workflow 有 paths 过滤，只认 `src/**`、`public/**` 等；正常现象 |
| 内网 200 但内容是旧的 | 看 Gitea Actions 里最新 run 是否 failure，或 `head_sha` 是不是你的提交 |
| 公网刚部署就 503 | CDN 刷新中，等 10–30 秒 |
| 暗色模式某块看不清 | 大概率写死了色值，改用 CSS 变量 |

更多坑（SIGPIPE 误判、Windows 截图视口、SSH 代理抖动）见 [AGENTS.md](./AGENTS.md) 第 6 节。
