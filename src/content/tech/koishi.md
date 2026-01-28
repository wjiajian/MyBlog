---
slug: koishi
title: 通过 Docker+Koishi+NapCat 搭建 QQ 机器人
year: 2025
date: 2025-11-12
description: 在Ubuntu服务器上搞定一个稳定高效的QQ机器人。本文包含完整流程：使用国内镜像安装Docker、持久化部署Koishi机器人框架、一键安装NapCat并用screen后台运行、配置OneBot正向WebSocket连接，还附带常用Docker命令参考。
coverImage: /images/Koishi/coverImage.png
tags:
  - 聊天机器人
  - Docker
categories: 笔记
type: tech
---

## 📖 简介

[Koishi](https://koishi.chat/zh-CN/) 是一个功能强大、可扩展的跨平台机器人框架。本指南将引导你如何在 Ubuntu 服务器上，通过 Docker 快速部署 Koishi，并使用 [NapCat](https://github.com/NapNeko/NapCat-Installer) 作为 QQ 适配器，最终搭建一个稳定、高效的 QQ 机器人。

---

## ⚠️ 准备工作

在开始之前，请确保你已准备好以下环境：

1.  一台拥有公网 IP 的 Ubuntu 服务器。
2.  一个用于登录的 QQ 小号。
3.  确保服务器防火墙或云服务商安全组已开放以下端口：

| 端口   | 用途                               | 说明                                     |
| :----- | :--------------------------------- | :--------------------------------------- |
| `5140` | **Koishi 控制台**                  | 用于访问 Koishi 的网页管理面板。         |
| `6099` | **NapCat WebUI**                   | 用于访问 NapCat 的网页管理面板（扫码登录）。 |
| `3001` | **NapCat HTTP API**                | NapCat 提供的 HTTP API 端口。            |
| `3000` | **NapCat 正向 WebSocket API**      | Koishi 连接 NapCat 所使用的端口。        |

---

## 步骤一：安装 Docker 环境

本部分参考自博客 [蓝羽天空](https://www.cnblogs.com/lanyusky/p/19187095)，并已适配国内网络环境。

#### 1. 检查旧版本

验证当前环境是否已安装旧版本 Docker。如果已安装，建议先卸载。
```bash
docker -v
```

#### 2. 更新软件包索引并安装依赖
```bash
sudo apt update
sudo apt install -y ca-certificates curl
```

#### 3. 添加 Docker 的 GPG 密钥

GPG 密钥用于验证软件包的完整性，确保其来源可信。
```bash
# 创建用于存储 GPG 密钥的目录
sudo install -m 0755 -d /etc/apt/keyrings

# 下载 GPG 密钥（使用阿里云镜像）
sudo curl -fsSL http://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc

# 更改密钥文件的权限，确保 apt 可以读取
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

#### 4. 添加 Docker 软件源
```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] http://mirrors.aliyun.com/docker-ce/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

#### 5. 安装 Docker
```bash
# 更新软件包索引
sudo apt update

# 安装 Docker 最新版本
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

#### 6. 配置国内镜像源

为了提升拉取 Docker 镜像的速度，建议配置国内镜像源。
```bash
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "http://hub-mirror.c.163.com",
    "https://docker.nju.edu.cn"
  ]
}
EOF
```

#### 7. 重启并验证 Docker
```bash
# 重启 Docker 服务使配置生效
sudo systemctl restart docker

# 设置 Docker 开机自启
sudo systemctl enable docker

# 验证 Docker 是否安装成功并可以正常运行
sudo docker run hello-world
```
如果能看到 "Hello from Docker!" 字样，说明 Docker 已成功安装。

---

## 步骤二：使用 Docker 安装 Koishi

运行以下命令来启动 Koishi 容器。

```bash
docker run -d \
  --name koishi \
  --restart always \
  -p 5140:5140 \
  -v /root/koishi_data:/koishi \
  -e TZ=Asia/Shanghai \
  koishijs/koishi
```

**参数说明:**
- `-d`: 后台运行容器。
- `--name koishi`: 将容器命名为 `koishi`，方便管理。
- `--restart always`: 容器退出时总是自动重启。
- `-p 5140:5140`: 将宿主机的 5140 端口映射到容器的 5140 端口。
- `-v /root/koishi_data:/koishi`: 将 Koishi 的数据（配置、插件等）持久化到宿主机的 `/root/koishi_data` 目录。
- `-e TZ=Asia/Shanghai`: 设置时区为东八区，确保日志时间正确。

> 容器运行后，稍等片刻即可通过浏览器访问 `http://<你的服务器IP>:5140` 进入 Koishi 控制台。

---

## 步骤三：安装并运行 NapCat

#### 1. 一键安装 NapCat
使用官方提供的一键安装脚本，以 TUI (终端图形界面) 模式进行安装。
```bash
curl -o napcat.sh https://nclatest.znin.net/NapNeko/NapCat-Installer/main/script/install.sh && sudo bash napcat.sh --tui
```
根据提示完成安装即可。

#### 2. 后台运行 NapCat
为了让 NapCat 能在关闭 SSH 连接后依然保持运行，我们使用 `screen` 工具。

```bash
# 启动一个名为 napcat 的后台会话，并运行 NapCat
screen -dmS napcat bash -c "xvfb-run -a /root/Napcat/opt/QQ/qq --no-sandbox"

# 如果需要附加到会话查看日志或扫码
screen -r napcat
```
> **提示**：在 `screen` 会话中，按 `Ctrl+A` 然后按 `D` 可以分离会话（使其在后台继续运行）。

#### 3. 登录 QQ
访问 `http://<你的服务器IP>:6099/webui`，进入 NapCat 的 WebUI，使用手机 QQ 扫描二维码登录。

---

## 步骤四：连接 Koishi 与 NapCat

#### 1. NapCat 中开启 WebSocket 服务
进入 NapCat WebUI (`http://<你的服务器IP>:6099/webui`) 后：
1.  点击左侧的「**网络配置**」。
2.  点击左上角的「**添加配置**」。
3.  新建一个「**正向 Websocket 服务器**」，格式如下图所示，然后保存。

![NapCat WebSocket 配置](/images/Koishi/websocket_server.png)

#### 2. Koishi 中安装 OneBot 适配器
NapCat 兼容 OneBot v11 协议，因此我们需要在 Koishi 中安装相应的适配器。
1.  进入 Koishi 控制台 (`http://<你的服务器IP>:5140`)。
2.  在左侧菜单中点击「**插件市场**」。
3.  搜索 `adapter-onebot` 并安装它。

#### 3. 配置 OneBot 适配器
安装完成后，Koishi 会自动跳转到配置页面（或在「插件配置」中找到 `adapter-onebot`）。
1.  点击「**添加机器人**」。
2.  在弹出的表单中，关键配置如下：
    - **`protocol`**: 选择 `ws` (正向 WebSocket)。
    - **`endpoint`**: 填写 NapCat 的 WebSocket 地址，即 `ws://127.0.0.1:3000`。
      > **注意**：因为 Koishi 和 NapCat 运行在同一台服务器的 Docker 网络中，此处建议使用 `ws://host.docker.internal:3000` 或宿主机内网IP，`127.0.0.1` 可能无法访问。最稳妥的方式是直接使用服务器的公网IP，例如 `ws://<你的服务器IP>:3000`。
3.  保存配置并启用该插件。

如果一切顺利，你应该能在 Koishi 控制台的「连接」页面看到状态为「ONLINE」的机器人。

---

## ✅ 完成

至此，Koishi 和 NapCat 的配置已全部完成。你的 QQ 机器人已经可以接收和发送消息了。接下来，你可以在 Koishi 的插件市场中探索和安装各种有趣的功能插件，打造属于你自己的强大机器人！

---

## 附录：常用 Docker 命令

```bash
# 查看所有正在运行的容器
docker ps

# 查看所有容器（包括已停止的）
docker ps -a

# 启动一个已停止的容器
docker start <容器ID或名称>

# 停止一个正在运行的容器
docker stop <容器ID或名称>

# 重启一个容器
docker restart <容器ID或名称>

# 进入一个正在运行的容器的命令行
docker exec -it <容器ID或名称> /bin/sh
```