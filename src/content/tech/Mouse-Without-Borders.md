---
slug: mouse-without-borders
title: 使用 Mouse Without Borders 实现一套键鼠控制多台电脑
year: 2026
date: 2026-01-16
description: 厌倦了在两套键盘鼠标间来回切换？使用微软官方神器 Mouse Without Borders (无界鼠标)！无需购买额外硬件，只需通过局域网，即可用一套键鼠无缝控制多台 Windows 电脑，甚至实现跨设备复制粘贴和文件拖拽，彻底释放你的桌面空间与生产力。
coverImage: /images/Mouse-Without-Borders/coverImage.png
categories: 技巧
type: tech
---

## 前言

在日常生活以及工作中，我们的桌面上往往不止一台电脑：一台主力台式机跑代码，一台 MacBook 或 Windows 笔记本查资料、回消息，更甚者多台台式机。。

最让人抓狂的莫过于桌面上摆着两套鼠标键盘，或者不停地在设备间切换外设。**Mouse Without Borders (无界鼠标)** 是微软推出的一款“神级”小工具，它允许我们在同一个局域网内，用 **一套鼠标和键盘** 无缝控制多达 4 台电脑，甚至还能在电脑之间 **复制粘贴文本和拖拽文件**。

虽然市面上有 Synergy 或 Logitech Flow，但 Mouse Without Borders 完全免费，且集成在微软官方的 PowerToys 工具集中，稳定性和兼容性极佳。

---

## 准备工作

在开始之前，请确保满足以下条件：

1.  **硬件：** 2 台或以上的 Windows 电脑（目前暂不支持 Mac/Linux）。
2.  **网络：** 所有电脑必须连接在 **同一个局域网**（即连接同一个路由器或 Wi-Fi）。
3.  **软件：**  Mouse Without Borders。

---

## 第一步：下载与安装

我们需要在 **所有** 想要控制的电脑上都安装 Mouse Without Borders。

1.  访问 [Microsoft Garage Mouse without Borders](https://www.microsoft.com/en-us/download/details.aspx?id=35460)。
2.  打开下载下来的 MouseWithoutBordersSetup.msi。
3.  一路 Next，Install，Finish 完成安装即可。

---

## 第二步：配置“主控机”

选择那台连接了物理键盘和鼠标的电脑作为“主控机”（Host）。

1.  打开 Mouse Without Borders。
2.  第一次安装使用该软件的话，先点击 NO。
![alt text](/images/Mouse-Without-Borders/host_1.png)
3.  点击左上角的 Skip 跳过，我们去设置自定义密钥。
![alt text](/images/Mouse-Without-Borders/host_2.png)
4.  点击 是。
![alt text](/images/Mouse-Without-Borders/host_3.png)
5.  进入到如下界面，我们勾选 Show text 之后，密钥就显示出来，我们设置一个长度至少为 16 位的比较好输入的密钥，然后点击下方的 Apply 按钮
![alt text](/images/Mouse-Without-Borders/host_4.png)

---

## 第三步：配置“被控机”

转到我们的第二台电脑（Client）。

1.  同样打开 Mouse Without Borders。
2.  这一次先点击 Yes。
![alt text](/images/Mouse-Without-Borders/client_1.png)
3.  输入刚才在主控机上生成的密钥，然后点击 Link。
![alt text](/images/Mouse-Without-Borders/client_2.png)
4.  然后点击 Next。
![alt text](/images/Mouse-Without-Borders/client_3.png)
5.  然后点击 Done。
![alt text](/images/Mouse-Without-Borders/client_4.png)
6.  进入如下界面，点击 Apply。
![alt text](/images/Mouse-Without-Borders/client_5.png)

> **注意：** 这里的逻辑是“共享密钥”。只要两台电脑处于同一局域网，且 **安全密钥** 完全一致，它们就会自动建立连接。

---

## 第四步：调整设备布局

连接成功后，我们的鼠标应该已经可以移出主控机的屏幕边缘，进入副机的屏幕了！但此时的方向可能不对（比如副机在左边，我们却要往右划才能过去）。

这时我们只需要在主控端拖动各个设备即可修改设备对应位置关系。

---

## 第五步：开始使用

配置完成后，我们可以尝试以下能够极大提升效率的操作：

### 1. 跨屏复制粘贴
在电脑 A 上选中一段文字或复制一张图片（Ctrl+C），鼠标移到电脑 B 上，直接按 Ctrl+V，内容就粘贴过来了！

> **设置提示：** 确保在设置中勾选了 **"共享剪贴板" (Share Clipboard)**。

### 2. 文件传输
虽然不建议传几个 G 的大文件，但传一些文档或小图片非常方便。直接将文件拖拽到屏幕边缘，穿过边界丢到另一台电脑桌面上。

> **设置提示：** 确保勾选 **"传输文件" (Transfer File)**，且文件大小在限制范围内（默认限制 100MB，可在设置里调整）。

![alt text](/images/Mouse-Without-Borders/settings.png)

---

## 常见问题排查

如果我们发现死活连不上，通常是以下两个原因：

### 1. 网络防火墙问题
这是最常见的原因。Windows 防火墙可能会拦截局域网通信。
*   **解决方法：** 确保两台电脑的网络属性都设置为 **"专用网络" (Private Network)** 而不是“公用”。或者在防火墙设置中允许 PowerToys 进程通过。

### 2. IP 地址解析问题
如果自动连接失败，可以尝试手动指定 IP。
*   **解决方法：** 在 Mouse Without Borders 设置中找到 **"IP 映射"**，手动输入 `IP地址 电脑名称`（例如：`192.168.1.5 MyLaptop`）。

---

## 总结

通过 Mouse Without Borders，我们不仅省下了一套键鼠的钱，更重要的是打通了多台设备，让工作流不再被打断。对于双机党来说，这绝对是装机必备的神器。

---

### *附录：快捷键清单*
*   `Ctrl + Alt + P`：暂停/恢复 Mouse Without Borders
*   `Ctrl + Alt + L`：锁定所有连接的计算机
*   `Ctrl + Alt + F`：切换到单机模式