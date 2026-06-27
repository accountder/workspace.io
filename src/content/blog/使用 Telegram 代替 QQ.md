---
title: '使用 Telegram 代替 QQ'
description: '使用 Docker 配置 Telegram 客户端，替代 QQ 进行日常通讯'
pubDate: 'Sep 17 2022'
category: '技术笔记'
tags: ['Telegram', 'Docker', '通讯']
---
## 平时使用QQ比较少，但是有一些消息还是要看看，所以这也是个解决办法.


# 首先你的设备支持Docker
# 安装 go-cq 并且初始化
```
docker run --rm -it \
--name="cqhttp" \
-v /opt/cqhttp:/data \
--network=host \
dswang2233/gocqhttp
```

*  **T根据自己实际情况选择映射路径**
* 停止容器，然后你可以找到 config.yml 在 /opt/cqhttp,复制下面的模板到 config.yml

```
# go-cqhttp 默认配置文件

account: # 账号相关
  uin:  # QQ账号
  password: '' # 密码为空时使用扫码登录
  encrypt: false  # 是否开启密码加密
  status: 0      # 在线状态 请参考 https://docs.go-cqhttp.org/guide/config.html#在线状态
  relogin: # 重连设置
    delay: 3   # 首次重连延迟, 单位秒
    interval: 3   # 重连间隔
    max-times: 0  # 最大重连次数, 0为无限制

  # 是否使用服务器下发的新地址进行重连
  # 注意, 此设置可能导致在海外服务器上连接情况更差
  use-sso-address: true

heartbeat:
  # 心跳频率, 单位秒
  # -1 为关闭心跳
  interval: 10

message:
  # 上报数据类型
  # 可选: string,array
  post-format: array
  # 是否忽略无效的CQ码, 如果为假将原样发送
  ignore-invalid-cqcode: false
  # 是否强制分片发送消息
  # 分片发送将会带来更快的速度
  # 但是兼容性会有些问题
  force-fragment: false
  # 是否将url分片发送
  fix-url: false
  # 下载图片等请求网络代理
  proxy-rewrite: ''
  # 是否上报自身消息
  report-self-message: false
  # 移除服务端的Reply附带的At
  remove-reply-at: false
  # 为Reply附加更多信息
  extra-reply-data: true
  # 跳过 Mime 扫描, 忽略错误数据
  skip-mime-scan: false

output:
  # 日志等级 trace,debug,info,warn,error
  log-level: warn
  # 日志时效 单位天. 超过这个时间之前的日志将会被自动删除. 设置为 0 表示永久保留.
  log-aging: 1
  # 是否在每次启动时强制创建全新的文件储存日志. 为 false 的情况下将会在上次启动时创建的日志文件续写
  log-force-new: true
  # 是否启用日志颜色
  log-colorful: true
  # 是否启用 DEBUG
  debug: false # 开启调试模式

# 默认中间件锚点
default-middlewares: &default
  # 访问密钥, 强烈推荐在公网的服务器设置
  access-token: ''
  # 事件过滤器文件目录
  filter: 'filter.json'
    # filter: ''
#   API限速设置
  # 该设置为全局生效
  # 原 cqhttp 虽然启用了 rate_limit 后缀, 但是基本没插件适配
  # 目前该限速设置为令牌桶算法, 请参考:
  # https://baike.baidu.com/item/%E4%BB%A4%E7%89%8C%E6%A1%B6%E7%AE%97%E6%B3%95/6597000?fr=aladdin
  rate-limit:
    enabled: false # 是否启用限速
    frequency: 1  # 令牌回复频率, 单位秒
    bucket: 1     # 令牌桶大小

database: # 数据库相关设置
  leveldb:
    # 是否启用内置leveldb数据库
    # 启用将会增加10-20MB的内存占用和一定的磁盘空间
    # 关闭将无法使用 撤回 回复 get_msg 等上下文相关功能
    enable: true

  # 媒体文件缓存， 删除此项则使用缓存文件(旧版行为)
  cache:
    image: data/image.db
    video: data/video.db

# 连接服务列表
servers:
  # 添加方式，同一连接方式可添加多个，具体配置说明请查看文档
  #- http: # http 通信
  #- ws:   # 正向 Websocket
  #- ws-reverse: # 反向 Websocket
  #- pprof: #性能分析服务器
  # 反向WS设置
#   - ws-reverse:
#       # 反向WS Universal 地址
#       # 注意 设置了此项地址后下面两项将会被忽略
#       universal: ws://172.17.0.1:8089/qq/receive
#       # 反向WS API 地址 主傻妞
#       api: ws://your_websocket_api.server
#       # 反向WS Event 地址
#       event: ws://your_websocket_event.server
#       # 重连间隔 单位毫秒
#       reconnect-interval: 3000
#       middlewares:
#         <<: *default # 引用默认中间件
  - ws-reverse:
      # 反向WS Universal 地址
      # 注意 设置了此项地址后下面两项将会被忽略
    #  universal: ws://127.0.0.1:5800/qq/receive
      # 反向WS API 地址 替身
    #  api: ws://your_websocket_api.server
      # 反向WS Event 地址
    #  event: ws://your_websocket_event.server
      # 重连间隔 单位毫秒
    #  reconnect-interval: 3000
    #  middlewares:
        <<: *default # 引用默认中间件
    # HTTP 通信设置
  - http:
    #   # 是否关闭正向 HTTP 服务器
    #   disabled: false
    #   # 服务端监听地址
    #   host: 127.0.0.1
    #   # 服务端监听端口
    #   port: 5800
      # HTTP监听地址
      address: 0.0.0.0:5800
      # 反向 HTTP 超时时间, 单位秒
      # 最小值为 5，小于 5 将会忽略本项设置
      timeout: 5
      middlewares:
        <<: *default # 引用默认中间件
        # filter: ''
      # 反向 HTTP POST 地址列表
      post:
        - url: 'http://127.0.0.1:8000' # 地址
          secret: ''                   # 密钥保持为空
```
* 你只需要填写账户和密码

# 创建一个tg机器人
* [Create a bot](https://t.me/BotFather) and sent `/mybots`
-   sent `/setprivacy` to @BotFather,choose your bot and choose `Disable`.
-   sent `/setjoingroups` to @BotFather,choose your bot and choose `Enable`.
-   sent `/setcommands` to @BotFather,choose your bot,and sent those：

```
help - 查看帮助列表
link - 将会话绑定到 Telegram 群组
unlink_all - 取消 Telegram 群组的链接
info - 显示当前的 群组的信息
chat - 生成一个聊天
extra - 获取更多功能
recog - 回复语音消息以进行识别
update_info - 更新绑定的 Telegram 群组的信息
react - 向一条消息作出回应，或列出回应者列表
rm - 从远端会话中删除一个消息
info - 展示频道相关信息
```

# 安装 [EFB](https://github.com/ehForwarderBot/ehForwarderBot) Docker 

```
docker run -dit \
--name efb \
--restart always \
--network=host \
-v /opt/efb:/root/.ehforwarderbot \
dswang2233/ehforwarderbot
```

* 然后创建一个目录在 /opt/efb 
* **目录树**

```
efb
├─profiles
|    ├─default
|    |    ├─config.yaml
|    |    ├─milkice.qq
|    |    |     └config.yaml
|    |    ├─blueset.telegram
|    |    |        ├─config.yaml
```

* Two templates
* `blueset.telegram/config.yaml`

```
##################
# Required items #
##################
 
# [Bot Token]
# This is the token you obtained from @BotFather
token: "12345678:QWFPGJLUYarstdheioZXCVBKM"
 
# [List of Admin User IDs]
# ETM will only process messages and commands from users
# listed below. This ID can be obtained from various ways
# on Telegram.
admins:
- 123456
 
 
##################
# Optional items #
##################
# [Experimental Flags]
# This section can be used to toggle experimental functionality.
# These features may be changed or removed at any time.
# Options in this section is explained afterward.
flags:
    option_one: 10
    option_two: false
    option_three: "foobar"
 
 
# [Network Configurations]
# [RPC Interface]
# Refer to relevant sections afterwards for details.
```
```
#token: "12345678:QWFPGJLUYarstdheioZXCVBKM"
#fill in bot token

#admins:
#- 123456
#fill in yout acount id 
```

* `mikice.qq/config/yaml`

```
Client: GoCQHttp                      # 指定要使用的 QQ 客户端（此处为 GoCQHttp）
GoCQHttp:
    type: HTTP                        # 指定 efb-qq-plugin-go-cqhttp 与 GoCQHttp 通信的方式 现阶段仅支持 HTTP
    access_token:
    api_root: http://127.0.0.1:5800/  # GoCQHttp API接口地址/端口
    host: 127.0.0.1                   # efb-qq-slave 所监听的地址用于接收消息
    port: 8000                        # 同上
```

# 两个容器一起运行
## go-cq 

```
docker run -itd \
--name cqhttp \
--network=host \
--restart=always \
-v /opt/cqhttp:/data \
dswang2233/gocqhttp:latest
```
go-cq logs

![](https://p1.meituan.net/dpplatform/7ef33f4368e89ef8d44b0b4d9334e53111786.png)
![](https://p0.meituan.net/dpplatform/0d3a28b7f653625950c0eb2c45c423cc139392.png)

# 特别感谢
- **[EH Forwarder Bot](https://github.com/ehForwarderBot/ehForwarderBot)**
- **[Efb-qq-slave](https://github.com/ehForwarderBot/efb-qq-slave)**
- **[Efb-qq-plugin-go-cqhttp](https://github.com/XYenon/efb-qq-plugin-go-cqhttp)**
- **[Docker-ehforwarderbot](https://github.com/jemyzhang/docker-ehforwarderbot)**
- **[安装并使用 EFB：在 Telegram 收发 QQ 消息](https://milkice.me/2018/09/17/efb-how-to-send-and-receive-messages-from-qq-on-telegram/)**


