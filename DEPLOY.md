# 博客更新指南

## 本地预览

```bash
npm run dev
```

打开 `http://localhost:4321/workspace.io/` 查看。

---

## 发表新文章

在 `src/content/blog/` 下创建 `.md` 文件，格式：

```markdown
---
title: '文章标题'
description: '文章描述'
pubDate: 'May 24 2026'
heroImage: '../../assets/图片.png'
---

正文内容，支持 **Markdown** 语法。
```

`heroImage` 路径相对于 `src/content/blog/` 文件所在位置。

**示例：** 同目录下的图片 → `./图片名.png`

### 发布

```bash
npm run build         # 构建到 docs/
git add -A
git commit -m "发表新文章：xxx"
git push              # GitHub Pages 自动更新
```

---

## 更换文章头图 (Banner)

将图片放入 `src/content/blog/` 目录，修改文章 frontmatter 中的 `heroImage`：

```yaml
heroImage: './banner.png'
```

然后构建推送：

```bash
npm run build
git add -A
git commit -m "更新文章头图"
git push
```

---

## 更新首页

编辑 `src/pages/index.astro`，修改后：

```bash
npm run build
git add -A
git commit -m "更新首页"
git push
```

---

## 完整部署流程

```bash
# 1. 构建
npm run build

# 2. 提交并推送
git add -A
git commit -m "更新说明"
git push
```

等待 1-2 分钟，GitHub Pages 自动生效。

---

## 目录结构

```
src/
├── assets/            # 静态资源（图片、字体）
├── components/        # 可复用的组件
│   ├── Header.astro
│   ├── Footer.astro
│   ├── HeaderLink.astro
│   └── BaseHead.astro
├── content/
│   └── blog/          # 博客文章（.md 文件）
├── layouts/           # 页面布局
├── pages/             # 页面
│   ├── index.astro    # 首页
│   ├── about.astro
│   ├── blog/          # 博客列表页
│   └── rss.xml.js
├── styles/
│   └── global.css     # 全局样式
docs/                  # 构建产物（不要手动修改）
```
