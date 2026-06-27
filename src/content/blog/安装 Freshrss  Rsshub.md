---
title: '安装 Freshrss & Rsshub'
description: '使用 Docker 部署 Freshrss 和 Rsshub 搭建个人 RSS 阅读服务'
pubDate: 'Sep 17 2022'
category: '技术笔记'
tags: ['Freshrss', 'RSS', 'Docker']
---
# 首先你的设备支持Docker
```
docker run -d \
  --name freshrss \
  --restart unless-stopped \
  --log-opt max-size=10m \
  -e TZ="Asia/Shanghai" \
  -e 'CRON_MIN=*/20' \
  -p 10086:80 \
  -v /opt/freshrss/data:/var/www/FreshRSS/data \
  -v /opt/freshrss/extensions:/var/www/FreshRSS/extensions \
  freshrss/freshrss:latest
```
*  **根据自己实际情况选择映射路径**
[Freshrss Official Documents](https://hub.docker.com/r/freshrss/freshrss)

# Freshrss and Rsshub 可以一起用
* 同样使用Docker
```
docker run -d \
  --name rsshub -p 1200:1200 \
  -e YOUTUBE_KEY= \
  --restart unless-stopped \
diygod/rsshub
```

# Web UI 
![image.png](https://p0.meituan.net/dpplatform/f370541dcad0714ab8f82d1af750d3d833207.png)

# 特别感谢
* **[Freshrss](https://freshrss.org/)**
* **[Rsshub](https://docs.rsshub.app/)**


