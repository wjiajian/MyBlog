# Gemini CLI 安装指南

## 1. 安装 Node.js

Gemini CLI 需要 Node.js 运行环境。推荐使用 `nvm` (Node Version Manager) 来安装和管理 Node.js 版本。

### 1.1. 安装 nvm

- **Windows:**
  - 从 [nvm-windows](https://github.com/coreybutler/nvm-windows/releases) 下载并运行最新的安装程序。
- **macOS / Linux:**
  - 打开终端并运行以下命令：
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    ```
  - 关闭并重新打开终端。

### 1.2. 使用 nvm 安装 Node.js

安装 `nvm` 后，在终端中运行以下命令来安装最新的 Node.js LTS 版本：

```bash
nvm install --lts
nvm use --lts
```

验证 Node.js 是否安装成功：

```bash
node --version
npm --version
```

## 2. 安装 Gemini CLI

使用 `npm` (Node Package Manager) 全局安装 Gemini CLI：

```bash
npm install -g @google/gemini-cli
```

安装完成后，验证 Gemini CLI 是否安装成功：

```bash
gemini --version
```

## 3. 安装 VS Code 拓展

为了在 VS Code 中获得更好的体验，可以安装官方的 Gemini CLI 辅助拓展。

在 VS Code 的拓展市场中搜索并安装 "Gemini CLI Companion"。

## 4. 配置 Google Cloud 环境

Gemini CLI 需要一个 Google Cloud 项目来进行身份验证和计费。

### 4.1. 创建或选择 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)。
2. 如果您还没有项目，请创建一个新项目。
3. 记下您的 **Project ID**。

### 4.2. 启用所需的 API

您需要为您的项目启用 "Gemini for Google Cloud"。

1. 在 Google Cloud Console 中，导航到 "APIs & Services" > "Library"。
2. 搜索 "Gemini for Google Cloud" 并启用它。

### 4.3. 配置本地环境
配置系统环境变量 GOOGLE_CLOUD_PROJECT，值为 **Project ID**。

## 5. 开始使用 Gemini CLI

现在您可以开始使用 Gemini CLI 了。在终端中运行：

```bash
gemini
```

这会启动一个交互式的会话。您也可以直接在命令行中使用 `gemini` 命令，例如：

```bash
gemini "你好"
```