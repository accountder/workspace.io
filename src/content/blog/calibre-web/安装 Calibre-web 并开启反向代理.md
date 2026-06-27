---
title: '安装 Calibre-web 并开启反向代理'
description: '使用 Docker 部署 Calibre-web 并配置 Nginx 反向代理的完整步骤'
pubDate: 'Sep 17 2022'
category: '技术笔记'
tags: ['Calibre', 'Docker', '反向代理']
heroImage: './banner.png'
---
# 首先你的设备支持Docker
```
  docker run -d \
  --name=calibre-techno-web \
  -e TZ=Asian/Shanghai \
  -e DOCKER_MODS=linuxserver/calibre-web:calibre \
  -p 8083:8083 \
  -v /volume2/docker/calibre/config:/config \
  -v /volume1/download1/books:/books \
  --restart unless-stopped \
  technosoft2000/calibre-web
```
*  **根据自己实际情况选择映射路径**

# 设置 Nginx Proxy Manager
这是解决方法 [issue 1891](https://github.com/janeczku/calibre-web/issues/1891)

In Nginx Proxy  Manager create a new proxy host for Calibre-Web. You can enable force SSL, HSTS and Block Common Exploits without any problems. Go to advanced tab  and enter the following parameters  :
```
proxy_buffer_size 128k;
proxy_buffers 4 256k;
proxy_busy_buffers_size 256k;
```

# 特别感谢
* **[Nginx Proxy  Manager](https://nginxproxymanager.com/)**
* **[Calibre-web](https://github.com/janeczku/calibre-web)**








