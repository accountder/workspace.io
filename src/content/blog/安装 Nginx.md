---
title: '安装 Nginx'
description: '使用 Docker 快速部署 Nginx 反向代理服务器'
pubDate: 'Sep 17 2022'
category: '技术笔记'
tags: ['Nginx', 'Docker', '反向代理']
---
# 安装 Nginx
```
docker run --name nginx -p 80:80 -d nginx
```

# 从容器复制文件到宿主机
```
docker cp e88:/etc/nginx/nginx.conf /opt/nginx/
docker cp e88:/etc/nginx/conf.d/default.conf /opt/nginx/conf/
docker cp e88:/usr/share/nginx/html/ /opt/nginx/www/
docker cp e88:/var/log/nginx/ /opt/nginx/logs/
```
* “c1e” is 容器id
* For example![image.png](https://s2.loli.net/2022/08/19/yFOmJt3PzoE9kiW.png)

# 停止，然后删除容器

```
docker run --name nginx -p 688:80 \
-v /opt/nginx/conf/conf.d/default.conf:/etc/nginx/conf.d/default.conf \
-v /opt/www:/usr/share/nginx/html:ro \
-v /opt/nginx/logs:/var/log/nginx \
-v /opt/nginx/nginx.conf:/etc/nginx/nginx.conf --privileged=true -d nginx
```
*  **根据自己实际情况选择映射路径**
# 特别感谢
* **[Portainer](https://www.portainer.io/)**
-   **[Nginx](https://www.nginx.com/)**


