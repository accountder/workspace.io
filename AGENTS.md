# AGENTS.md

给 AI 助手的操作契约。**动手前先读完本文档**，尤其是「发布流程」和「已知坑」两节。
本文档是发布链路的事实来源；如果代码与本文档冲突，以代码为准，并顺手修正本文档。

---

## 1. 这是什么

个人博客「财税笔记」（Astro 6 + Bear Blog 主题改造版），纯静态站。

- 仓库路径：`E:/001vscode/blog/workspace.io`（Windows，shell 为 Git Bash）
- 本地 Node `v22.22.2` / npm `10.9.7`，CI 用 Node 22
- 依赖：`astro 6.x`、`@astrojs/mdx`、`@astrojs/sitemap`、`@astrojs/rss`、`sharp`
- 构建产物：**`dist/`**（已在 `.gitignore`，永远不要提交）
- `astro.config.mjs` 里 `site: https://accountder.github.io`，`base: /workspace.io`

**两套部署，两条远端，必须分开操作。** 这是本仓库最容易出错的地方。

---

## 2. 远端拓扑

| remote | 地址 | 作用 |
|---|---|---|
| `origin` / `gitea` | `ssh://git@192.168.5.189:2222/admin/workspace.io.git` | 内网 Gitea，**push 即触发构建并部署到 NAS** |
| `github` | `git@github-workspace:accountder/workspace.io.git` | 公网 GitHub，**push 即触发 GitHub Pages** |

关键事实：

- **`git push` 只推内网 Gitea，不会推 GitHub。** 公网发布必须显式 `git push github main`。
- Gitea SSH 端口是 **2222**（不是 22，22 从本机不通）。
- `github` 走 SSH 别名 `github-workspace`（`~/.ssh/config` 绑定专用密钥 `github_workspace_io`），不要改成 `git@github.com:`，会因密钥不对被拒。
- 提交身份已设为仓库级 `accountder / accountder@users.noreply.github.com`，不要改。

| 环境 | 地址 | 何时更新 |
|---|---|---|
| NAS 预发 | `http://192.168.5.189/workspace.io/` | `git push` 后约 1–3 分钟 |
| 公网 | `https://accountder.github.io/workspace.io/` | `git push github main` 后约 40 秒 |

---

## 3. 发布流程（严格按顺序）

用户既定策略：**先发内网验证，没问题再发公网。** 不要跳过中间验证直接推 GitHub。

### 步骤 0 · 本地预检（推荐，能省一轮 CI）

```bash
cd "E:/001vscode/blog/workspace.io"
npm run build 2>&1 | tail -20
```

期望：`Complete`，13 个页面左右，无 error。有 error 就地修，不要推上去让 CI 报错。

本地预览看效果：

```bash
npm run preview          # 后台跑，注意 base 路径
# 访问 http://localhost:4321/workspace.io/
```

### 步骤 1 · 推内网，触发构建

```bash
git add -A && git commit -m "chore: ..." && git push
```

`.gitea/workflows/deploy.yml` 会在 push 到 `main` 时自动跑，流程是：检查 `/deploy` 挂载 → 拉代码 → `npm ci` → `npm run build` → 清空 `/volume1/web/workspace.io` → 同步产物 → HTTP 自检。

**注意 paths 过滤**：只有 `src/**`、`public/**`、`astro.config.mjs`、`package*.json`、workflow 自身变化才会触发。**只改 `AGENTS.md` / `DEPLOY.md` 不会产生新的 run**，别等不到就以为挂了。

### 步骤 2 · 查构建结果（Gitea API）

令牌在 `~/.config/gitea/token`（仅本机，勿提交、勿打印）。

```bash
TOKEN=$(cat ~/.config/gitea/token)
curl -s -H "Authorization: token $TOKEN" \
  "http://192.168.5.189:3100/api/v1/repos/admin/workspace.io/actions/tasks?limit=3" \
| python -c "import sys,json;[print(r['run_number'],r['status'],r.get('conclusion'),r.get('head_sha','')[:7]) for r in json.load(sys.stdin)['workflow_runs']]"
```

- `status` 出现 `running` / `waiting` / `queued` → 继续等（首次拉镜像可能要 1–2 分钟）
- `conclusion` 必须是 `success`；`failure` 就查日志：

```bash
curl -s -H "Authorization: token $TOKEN" \
  "http://192.168.5.189:3100/api/v1/repos/admin/workspace.io/actions/runs/<run_number>/logs" -o /tmp/log.zip
```

确认最新 run 的 `head_sha` **就是你刚推的提交**，否则说明没触发。

### 步骤 3 · 验 NAS 站点（构建成功 ≠ 页面正确）

不要只看 HTTP 200，要验内容是不是新版：

```bash
# 首页 / 列表 / 文章 / RSS 全绿
for p in "" "blog/" "about/" "rss.xml"; do
  printf "%-12s " "/$p"
  curl -s -o /dev/null -w "%{http_code}\n" -m 10 "http://192.168.5.189/workspace.io/$p"
done
# 不存在的路径应返回 404
curl -s -o /dev/null -w "%{http_code}\n" "http://192.168.5.189/workspace.io/__nope__/"
```

再用**本次改动独有的特征**确认版本（举例）：

```bash
curl -s "http://192.168.5.189/workspace.io/blog/" | grep -o "共 [0-9]* 篇"
```

### 步骤 4 · 推公网

**只有步骤 3 通过后才执行。**

```bash
GIT_SSH_COMMAND="ssh -o ConnectTimeout=30" git push github main
```

推之前先确认没有分叉：

```bash
git fetch github main
git rev-list --left-right --count main...github/main   # 输出 "N 0" 才是干净快进
```

若右侧不为 0（GitHub 有本地没有的提交），**停下来问用户**，不要强推。

### 步骤 5 · 验公网

GitHub Pages 约 40 秒生效。最适合的判据是**比对静态资源文件名**（Astro 按内容哈希命名，内容相同则哈希相同）：

```bash
CSS=$(grep -o '/workspace.io/_astro/[^"]*\.css' dist/index.html | head -1 | xargs -r basename)
for i in $(seq 1 10); do
  curl -s -m 15 "https://accountder.github.io/workspace.io/" | grep -q "$CSS" \
    && { echo "已上线: $CSS"; break; }
  echo "[$i] 仍是旧版"; sleep 15
done
```

换过首屏文案时也可直接 grep 新文案。**本机没有 `gh` CLI 也没有 GitHub token，查不了 Actions API**，只能靠线上内容判断——所以这套内容比对是必需的，不是可选。

---

## 4. 写文章

目录约定：`src/content/blog/<slug>/<文件名>.md`，一篇文章一个目录，图片同目录放着用 `./banner.png` 引用。

frontmatter 以 `src/content.config.ts` 的 schema 为准：

```yaml
---
title: '文章标题'            # 必填
description: '一句话摘要'      # 必填，用于列表页与 og:description
pubDate: 'May 25 2026'       # 必填，可被 z.coerce.date 解析的任意格式
updatedDate: 'Jun 01 2026'   # 可选
heroImage: './banner.png'    # 可选；相对当前 md 文件
category: '财税自动化'        # 可选；决定标签配色，见 src/lib/site.ts
tags: ['Automa', '数电票']    # 可选
---
```

写文章的硬规则（历史上踩过）：

- **正文不要写 `# 一级标题`**，页面已渲染 `title`，重复会出现两个 `<h1>` 且层级倒置。正文从 `##` 开始。
- **不要在正文里再插一遍 `heroImage` 那张图**，会变成同一张图连出两次。头图由布局渲染，正文只放补充图。
- 中文与代码混排的文章，代码块务必标注语言（```` ```bash ````），否则没有语法高亮和语言标签。
- **不要手写 mermaid**，本项目没有 mermaid 渲染器，会以源码形式暴露。流程图用 `.flow` 结构（见 `tax-automa` 那篇的写法）。
- 文件名与 slug 尽量用 ASCII；历史遗留的中文文件名可以保留，但会进 URL。
- 保存为 **UTF-8 无 BOM**（历史上所有文件都带 BOM，已修过一轮；用 Node/编辑器脚本批量写文件时注意）。

---

## 5. 改样式与组件

设计系统集中在 `src/styles/global.css` 的 token 里，**优先复用，不要新造**：

- 容器宽度：`--container`（正文 720）/ `--container-wide`（1120，头部/列表/页脚）
- 间距：4px 基数（`--space-1` … `--space-8`）
- 圆角：`--radius-xs / --radius / --radius-lg`，不要引入第 4 种
- 阴影：两级，`--shadow` / `--shadow-lg`
- 颜色：一律用 `var(--text)` / `var(--bg-card)` / `var(--border)` 这类语义变量，**不要写死色值**，否则暗色模式必崩

约束：

- 全局已有 `box-sizing: border-box`，新增组件不要自己再写一遍
- 主题切换只给需要过渡的容器加 `transition`，**禁止 `html * { transition }`**（会让全页重绘）
- 代码块用 Astro 双 Shiki 主题（light: `github-light` / dark: `github-dark`），暗色靠 `html[data-theme=dark] .astro-code { color: var(--shiki-dark) !important }` 切。改代码块样式时两套主题都要看。
- 深色模式下 `--bg-page` 与 `--bg-card` 已刻意拉开，改动时要保住这个差值，否则卡片会"融"进背景
- 表格会被 `.table-wrap` 自动包裹提供横向滚动，别在外面再包一层

---

## 6. 已知坑

| 坑 | 表现 | 对策 |
|---|---|---|
| `git push` 不推 GitHub | 公网一直是旧版 | 显式 `git push github main` |
| Gitea workflow 有 paths 过滤 | 只改文档时永远没有新 run | 属正常，不要反复重推 |
| Gitea Actions 带 `set -o pipefail` | `echo "$body" \| grep -q x` 在大响应上收到 SIGPIPE(141)，管道误判失败 | 用 bash 内建 `[[ "$body" != *x* ]]` |
| GitHub Pages 子路径偶发 503 | 部署后立刻访问报 503 | CDN 刷新，等 10–30 秒 |
| GitHub 走代理 | SSH 偶发 `Connection closed` | 代理抖动，重试即可 |
| `astro.config.mjs` 的 `site` 是公网域名 | 局域网访问时 RSS / canonical 指向 github.io | 已知设计取舍，未区分双构建；要改需引入环境变量 |
| Windows 上 Chrome headless 最小视口约 512px | `--window-size=390` 只是裁了图，不是真 390 宽 | 用 `--headless=old --window-size=512,...`；查真实溢出则注入脚本改 `document.title` 再 `--dump-dom` 读 `scrollWidth` |
| 截图里封面空白 | 图片还没解码 | 加 `--run-all-compositor-stages-before-draw --virtual-time-budget=8000` |
| 本机无 `gh` CLI / 无 GitHub token | 查不到 GitHub Actions 状态 | 用线上内容比对（见步骤 5） |

---

## 7. 禁止事项

- ❌ 不要提交 `dist/`、`node_modules/`、`.astro/`
- ❌ 不要在 `dist/` 里改东西（CI 会整个覆盖）
- ❌ 不要 `git push --force`，尤其是 `github`
- ❌ 不要打印或提交 `~/.config/gitea/token`、`~/.ssh/*` 内容
- ❌ 不要在没有用户确认的情况下改 GitHub Pages 的 Settings（Source 必须是 **GitHub Actions**）
- ❌ 不要把 `origin` 改成 GitHub，会打乱"先内网后公网"的流程
- ❌ 不要执行 `scripts/collect-infra.js` 后留下 `_infra.json`（含明文容器环境变量），用完必须删

---

## 8. 命令速查

```bash
cd "E:/001vscode/blog/workspace.io"

npm run dev            # 开发 http://localhost:4321/workspace.io/
npm run build          # 构建到 dist/
npm run preview        # 预览构建产物

git add -A && git commit -m "..." && git push          # → 内网 Gitea，自动构建部署 NAS
git push github main                                    # → 公网 GitHub Pages

git remote -v                                           # 确认远端
git fetch github main && git rev-list --left-right --count main...github/main
```

发布判定标准，一句话版：**`npm run build` 无 error → Gitea run `success` 且 `head_sha` 匹配 → NAS 四个路径 200 且内容是新版 → `github/main` 快进推送成功 → 公网资源哈希命中。**
