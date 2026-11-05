# 财税笔记

> 财税合规 · 技术实践 · 效率工具

聚焦建安制造、商贸批发与现代服务业的财税合规与风险管理，同时记录把重复劳动交给脚本和流程的实践过程。

**公网**：<https://accountder.github.io/workspace.io/>
**内网预发**：<http://192.168.5.189/workspace.io/>

---

## 内容

9 篇文章，5 个分类。不是泛泛的资讯站，而是两类东西的组合：

| 分类 | 内容 |
|---|---|
| 财税自动化 | 用 Automa / 脚本把数电票查询、导出、归档做成可重复执行的流程 |
| 财务分析 | 真实脱敏案例的财报拆解：资产结构 → 杜邦分解 → 风险分级 |
| 技术工具 | 电子税务局相关的 Chrome 扩展等自用工具，附完整可复现代码 |
| 技术笔记 | 自托管服务部署笔记（Nginx、Hexo、Calibre-web 等） |
| 生活记录 | 年度影音书清单 |

主线是「用技术解决财税问题」——技术内容不是噪音，是能力的证明。

---

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | [Astro](https://astro.build) 6（静态输出，零客户端框架） |
| 内容 | Markdown + MDX（Content Collections + Zod schema 校验） |
| 样式 | 原生 CSS，无框架。设计 token 集中在 `src/styles/global.css` |
| 代码高亮 | Shiki 双主题（`github-light` / `github-dark`） |
| 图片 | Astro `<Image>` + Sharp，构建期转 WebP 并生成响应式 `srcset` |
| 订阅 | 无站内搜索；提供 RSS (`/rss.xml`) 与 Sitemap |
| 部署 | 内网 Gitea Actions → 群晖 NAS；公网 GitHub Actions → GitHub Pages |

无客户端框架、无运行时依赖，页面是纯 HTML + 少量内联脚本。

---

## 本地开发

需要 Node 22+。

```bash
npm install
npm run dev       # http://localhost:4321/workspace.io/
```

> 注意 `astro.config.mjs` 设了 `base: '/workspace.io'`，**本地路径必须带这个前缀**，直接开 `localhost:4321/` 会 404。

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发服务器，热更新 |
| `npm run build` | 构建到 `dist/` |
| `npm run preview` | 预览构建产物（走真实产物，不是 dev 服务） |

---

## 目录结构

```
src/
├── assets/
│   └── fonts/                  # Atkinson Hyperlegible（本地 woff，无外部字体请求）
├── components/
│   ├── BaseHead.astro          # meta / OG / JSON-LD 统一出口
│   ├── Header.astro            # 吸顶导航，与内容列同宽
│   ├── Footer.astro
│   ├── ThemeToggle.astro       # 亮暗切换，is:inline 避免首屏闪烁
│   ├── PostCover.astro         # 文章封面：有图走 Image，无图生成占位
│   ├── FormattedDate.astro
│   └── HeaderLink.astro
├── content/
│   └── blog/<slug>/<name>.md   # 一篇文章一个目录，图片同目录
├── layouts/
│   └── BlogPost.astro          # 文章页：目录 / 进度条 / 代码复制 / 上下篇
├── lib/
│   └── site.ts                 # 分类配色、阅读时长、日期格式化
├── pages/
│   ├── index.astro             # 首页
│   ├── about.astro
│   ├── 404.astro
│   ├── rss.xml.js
│   └── blog/
│       ├── index.astro         # 列表页（分类筛选）
│       └── [...slug].astro     # 文章路由
├── styles/
│   └── global.css              # 设计 token + 全局样式
└── content.config.ts           # 内容集合 schema

scripts/collect-infra.js        # NAS 容器配置采集（一次性工具）
.gitea/workflows/               # 内网构建部署
.github/workflows/              # 公网 GitHub Pages
```

`dist/` 是构建产物，已在 `.gitignore`，不入库。

---

## 写文章

```markdown
---
title: '文章标题'
description: '一句话摘要，用于列表页与 og:description'
pubDate: 'May 25 2026'
heroImage: './banner.png'
category: '财税自动化'
tags: ['Automa', '数电票']
---

正文从 ## 开始。
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `title` | ✅ | 页面标题，正文不要再写一遍 |
| `description` | ✅ | 摘要，也用于 meta |
| `pubDate` | ✅ | 可被 `Date` 解析的任意格式 |
| `updatedDate` | | 有则在页面显示"更新于" |
| `heroImage` | | 相对当前 md 文件；不填则用占位封面 |
| `category` | | 决定标签配色，取值见 `src/lib/site.ts` |
| `tags` | | 字符串数组 |

四条硬规则（都是踩过的坑）：

1. **正文不要写 `# 一级标题`** —— 标题由布局渲染，重复会出现两个 `<h1>` 且层级倒置
2. **正文不要再插 `heroImage` 那张图** —— 同一张图会连出两次
3. **不要写 mermaid** —— 没有渲染器，会以源码形式暴露给读者；流程图用 `.flow` 结构
4. **保存为 UTF-8 无 BOM**

新增 `category` 时记得在 `src/lib/site.ts` 的 `CATEGORY_META` 补配色（亮暗各一套），否则标签会掉成灰色。

---

## 实现要点

**设计系统**：`global.css` 里只有一套 token——语义色（`--text` / `--bg-card` / `--border`）、4px 基数间距、三种圆角、两级阴影、两个容器宽度（正文 720 / 列表与头部 1120）。颜色不写死，因此暗色模式不需要单独的样式表。

**双主题代码块**：Shiki 在构建期同时输出亮暗两套 token，暗色靠 `html[data-theme="dark"] .astro-code { color: var(--shiki-dark) }` 切换，不用二次渲染。

**文章页**：右侧 sticky 目录（`IntersectionObserver` 高亮当前节）、顶部阅读进度条、代码块复制按钮、宽表格自动包横向滚动容器、上下篇与同类推荐。

**列表页**：分类筛选是客户端 `data-cat` 过滤，不产生额外请求；卡片统一 16:9 封面，缺图时按标题哈希生成稳定占位（每次构建结果一致）。

**SEO**：每篇文章的 `og:image` 用自身头图（不是全站同一张），补 `BlogPosting` JSON-LD、canonical、`theme-color`；RSS 与 Sitemap 构建期生成。

**首屏**：头图 `eager` + `fetchpriority=high`，列表图懒加载；开启 viewport prefetch。

---

## 部署

两段式，**先内网验证，再发公网**：

```bash
git push              # → 内网 Gitea，自动构建并部署到 NAS
git push github main  # → 公网 GitHub Pages
```

`git push` 只推内网（`origin` 指向 Gitea），公网必须显式推 `github`。

完整流程、构建校验方法与已知坑见 **[DEPLOY.md](./DEPLOY.md)**；给 AI 助手的操作契约见 **[AGENTS.md](./AGENTS.md)**。

---

## 声明

- 文中涉及的企业财务数据均已脱敏，不构成任何真实企业信息的披露。
- 涉及税务系统自动化的内容仅作技术记录，请遵守电子税务局使用协议，自行评估账号与数据安全风险。
- 代码可自由参考；文章内容转载请先联系。

---

本站由 Astro 构建，主题基于 [Bear Blog](https://github.com/dbarnett/astro-theme-bear) 改造。
