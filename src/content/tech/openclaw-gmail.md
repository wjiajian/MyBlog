---
slug: openclaw-gmail
title: OpenClaw 接入 Gmail：gog + Google OAuth
year: 2026
date: 2026-03-18
description: 记录一次 OpenClaw 接入 Gmail 的过程：从 Google OAuth 与 gog 授权，到 systemd user service 注入 GOG_KEYRING_PASSWORD，重点解决“终端可用但后台 no TTY”问题，并给出可复用的 10 步接入流程。
coverImage: /images/openclaw/openclaw_logo.png
categories: 笔记
type: tech
tags: 
  - OpenClaw
---

>Polished by GPT5.4

## 一、先看结论

OpenClaw 要稳定接入 Gmail，至少要满足下面 4 件事：

1. Google Cloud 已启用 `Gmail API` 和 `Google Calendar API`
2. `gog` 已导入 OAuth credentials，并完成账号授权
3. OpenClaw 运行环境能找到 `gog` 命令
4. OpenClaw 服务环境里设置了 `GOG_KEYRING_PASSWORD`

前 3 项都对，第 4 项漏掉，通常就会卡住。

---

## 二、我这次踩到的两个坑

### 1) 终端已授权，但 OpenClaw 里还是失败

在交互 shell 里：

```bash
gog auth list
```

能看到账号，例如：

```text
jiajian2233@gmail.com default gmail 2026-03-18T08:01:07Z oauth
```

但在 OpenClaw 环境里跑同一条命令会报错：

```text
read token for jiajian2233@gmail.com: read token: no TTY available for keyring file backend password prompt; set GOG_KEYRING_PASSWORD
```

这类报错的含义很直接：

- OAuth 凭据是有的
- token 文件也是有的
- 问题出在后台进程没有 TTY，`gog` 无法弹密码输入框

所以要把密码提前注入环境变量：

```bash
GOG_KEYRING_PASSWORD
```

### 2) 环境变量写进了错误的 unit

我一开始改的是 `openclaw.service`，但实际在跑的是：

```bash
openclaw-gateway.service
```

而且是 user-level systemd：

```text
~/.config/systemd/user/openclaw-gateway.service
```

unit 写错，配置再正确都不会生效。

---

## 三、接入流程

### 第 1 步：在 Google Cloud 创建 OAuth 凭据

1. 打开 <https://console.cloud.google.com/>
2. 新建一个项目（例如 `OpenClaw Gmail`）
3. 启用 API：
   - `Gmail API`
   - `Google Calendar API`
4. 按提示完成 OAuth consent screen（个人使用一般默认配置就够）
5. 在 `Credentials` 页面创建 `OAuth client ID`，类型选 `Desktop app`
6. 下载凭据 JSON，比如：

```text
client_secret_xxxxx.json
```

### 第 2 步：把凭据导入服务器上的 gog

先把 JSON 上传到 OpenClaw 所在机器，例如：

```bash
/home/jiajian/client_secret.json
```

导入命令：

```bash
gog auth credentials /home/jiajian/client_secret.json
```

可选检查：

```bash
ls -l /home/jiajian/client_secret.json
```

### 第 3 步：授权 Google 账号

```bash
gog auth add your@gmail.com --services gmail,calendar --manual
```

例如：

```bash
gog auth add jiajian2233@gmail.com --services gmail,calendar --manual
```

流程是：

1. 复制终端输出的授权链接
2. 浏览器打开并登录账号
3. 同意 Gmail / Calendar 权限
4. 跳转到 `127.0.0.1` 回调地址后，复制完整 URL
5. 把 URL 粘回终端

完成后执行：

```bash
gog auth list
```

能看到账号就说明授权成功。

### 第 4 步：确认 `gog` 命令可用

```bash
which gog
gog --help
```

### 第 5 步：先在 shell 验证凭据读取

```bash
gog auth list
```

如果这里正常，说明当前 shell 可以读取并解密 token。

注意，这不代表 OpenClaw 服务进程也能读取。

### 第 6 步：给 OpenClaw 服务注入 `GOG_KEYRING_PASSWORD`

后台服务没有交互终端，`gog` 读 keyring 时如果需要密码，就必须从环境变量获取。

报错通常是：

```text
no TTY available for keyring file backend password prompt; set GOG_KEYRING_PASSWORD
```

看到这条，优先检查服务环境变量，不要先怀疑 OAuth 流程。

### 第 7 步：确认实际运行的 systemd unit

```bash
openclaw gateway status
```

如果输出类似：

```text
Service file: ~/.config/systemd/user/openclaw-gateway.service
```

那要改的是 `openclaw-gateway`，不是 `openclaw`。

### 第 8 步：为 `openclaw-gateway` 写入环境变量

推荐用 override：

```bash
systemctl --user edit openclaw-gateway
```

写入：

```ini
[Service]
Environment="GOG_KEYRING_PASSWORD=密码"
```

然后执行：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway
```

### 第 9 步：重启后回到 OpenClaw 环境复查

```bash
echo "${GOG_KEYRING_PASSWORD:+SET}"
gog auth list
```

期望结果：

- 输出 `SET`
- `gog auth list` 可以正常列出账号

### 第 10 步：做一次真实 Gmail 查询

```bash
gog gmail search "in:inbox newer_than:7d" --plain | head
```

或指定账号：

```bash
gog gmail search "newer_than:7d" --max 5 --account your@gmail.com
```

能返回邮件列表，说明链路已打通。

---

## 四、收尾

这次排障的关键点其实很朴素：授权并不等于服务可用。OAuth 通了，只代表“我有票”；systemd 环境变量配对了，服务进程才“能进场”。
