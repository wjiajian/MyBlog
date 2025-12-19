> Claude Code 的使用大差不差，如果使用 Claude Code，强烈推荐 Claude Code Switch 来集中管理 API_KEY

# OpenCode

OpenCode 既是一款在终端中运行的 CLI + TUI AI 编程代理工具，也提供 IDE 的插件集成，能够在不同开发环境下完成快速代码生成、调试、项目分析、文件操作与跨项目协作等任务。
搭配各厂商的 Coding Plan，开发效率，开发稳定性和开发体验都能得到全面提升

## 安装 OpenCode
- 使用 curl 安装 OpenCode
`curl -fsSL https://opencode.ai/install | bash`
- 使用 npm 安装 OpenCode
`npm i -g opencode-ai`

# MiniMax M2

MiniMax M2 是由 MiniMax 公司开发的先进大语言模型。它能够理解和生成高度复杂和连贯的文本，具备强大的对话、推理和代码生成能力，适用于多种应用场景，如智能助理、内容创作和软件开发。

## 在 OpenCode 中使用 MiniMax-M2

- 运行认证命令
  `opencode auth login`
- 选择 minimax
- 输入你的 **MiniMax API Key**
- 进入项目目录，启动 opencode
- 输入 /models，选择 “MiniMax-M2”

# Oh My Posh

Oh My Posh 是一款功能强大的、可定制的跨平台终端提示符主题引擎。它允许用户通过配置不同的主题和插件，极大地美化终端界面，并能显示 Git 状态、路径信息、时间等多种实用信息，提升开发体验。

## 使用 Oh My Posh 美化终端
>此处默认已安装 Powershell 和 Terminal
- 安装 Oh My Posh 本体
`winget install JanDeDobbeleer.OhMyPosh -s winget`
- 安装字体支持
`oh-my-posh font install meslo`
- 在 Terminal 中设置 Powershell 字体

# 可能遇到的问题

### 1. OpenCode 安装问题
- **网络问题**：`curl` 或 `npm` 下载速度慢或失败。这通常是网络环境问题，可以尝试切换网络、使用代理或在网络状况良好的时候重试。
- **权限问题**：使用 `npm i -g` 全局安装时，可能会遇到权限不足的错误。在 macOS 或 Linux 上，可以尝试在命令前加上 `sudo` (`sudo npm i -g opencode-ai`)。在 Windows 上，请确保以管理员身份运行终端。
- **命令未找到**：安装后，输入 `opencode` 提示命令未找到。这通常是由于系统的 `PATH` 环境变量没有被正确配置。可以尝试重启终端，或者手动将 `opencode` 的安装路径添加到 `PATH` 环境变量中。

### 2. MiniMax API Key 问题
- **无效的 API Key**：输入的 API Key 不正确或已失效。请检查 Key 是否复制完整，或在 MiniMax 官网重新生成。
- **网络策略限制**：公司或本地防火墙可能会阻止对 MiniMax API 服务器的访问。请检查你的网络策略，确保 `api.minimax.com` 等地址没有被屏蔽。
- **账户余额不足**：API Key 关联的账户余额不足，导致请求失败。

### 3. Oh My Posh 美化问题
- **winget 命令不存在**：在较旧的 Windows 版本中，`winget` 可能未被安装。请先从 Microsoft Store 安装 "应用安装程序" 来获取 `winget`。
- **字体显示异常**：安装并设置 `meslo` 字体后，终端依然出现乱码或无法显示图标。请确保：
    1. 在 Windows Terminal 的设置中，已将 Powershell 的 "外观" -> "字体" 正确设置为 `MesloLGM NF`。
    2. 重启终端以使字体设置生效。
- **Oh My Posh 未自动启动**：每次打开新的 Powershell 窗口，都需要手动启动 Oh My Posh。这需要将初始化脚本添加到你的 Powershell 配置文件中。可以运行 `notepad $PROFILE`，在打开的文件中添加 `oh-my-posh init pwsh | Invoke-Expression` 并保存。如果提示文件不存在，请先运行 `New-Item -Path $PROFILE -Type File -Force` 创建它。
