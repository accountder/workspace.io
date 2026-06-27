---
title: 'Install Hexo & Hexo-Theme-Butterfly'
description: '使用 Docker 安装 Hexo 博客框架及 Butterfly 主题的步骤记录'
pubDate: 'Sep 17 2022'
category: '技术笔记'
tags: ['Hexo', 'Docker', '博客']
---
# Docker
```
docker create --name=hexo \
-e HEXO_SERVER_PORT=4000 \
-v /opt/hexo:/app \
-p 4000:4000 \
spurin/hexo
```

# Debian
```
apt install nodejs npm
```
## 1. Hexo install in the required directory
```
npm install hexo -g
```
## 2. Initialization
```
hexo init
```
## 3. Generate static files
```
hexo -g
```
## 4. Install butterfly theme
```
git clone -b master https://github.com/jerryc127/hexo-theme-butterfly.git themes/butterfly

npm i hexo-theme-butterfly
```
## 5. Run
```
hexo s
```
## 6. Check Results
```
http://localhost:4000
```

# Install Aplayer music
```
npm install hexo-tag-aplayer --save
```

`_config.yml`
```
# APlayer  
# https://github.com/MoePlayer/hexo-tag-aplayer/blob/master/docs/README-zh_cn.md  
aplayer:  
  meting: true  
  asset_inject: false
```

`_config.butterfly.yml`
```
# Inject the css and script (aplayer/meting)  
aplayerInject:  
  enable: true  
  per_page: true
```

`_config.butterfly.yml`
```
inject:  
  head:  
  bottom:  
    - <div class="aplayer no-destroy" data-id="5183531430" data-server="netease" data-type="playlist" data-fixed="true" data-mini="true" data-listFolded="false" data-order="random" data-preload="none" data-autoplay="false" muted></div>
```

# Special thanks
* **[Hexlo](https://hexo.io/)**
* **[Butterfly](https://github.com/jerryc127/hexo-theme-butterfly)**





