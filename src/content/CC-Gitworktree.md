# Git Worktree 与 Claude Code 

我们知道 Claude Code 在单个任务流中的强大能力，无论是实现新功能还是进行复杂的代码重构。但真实的开发场景往往更加复杂，我们经常需要同时处理多个不相关的任务：修复一个紧急 Bug、开发一个新功能、优化 CI/CD 流程等等。

这时传统的线性工作流在这种情况下会显得捉襟见肘。如果我们为每个任务都切换分支，不仅操作繁琐，而且难以在不同任务间快速预览和测试。如果直接在同一个分支上操作，又极易导致代码混乱和相互覆盖。

---

## Git Worktree

### 1. 核心概念：从“单线程”到“多线程”
在传统的 Git 认知中，一个仓库（Repository）对应一个工作区（Working Tree）。若需同时修复 Bug 和开发新功能，必须使用 `git stash` 暂存或重新 `git clone` 整个仓库。

**Git Worktree** 打破了这一限制。它允许一个 Git 仓库关联 **多个独立的工作目录**。
*   **共享元数据**：所有 Worktree 共享同一个 `.git` 目录（对象库、引用、配置）。这意味着在 Worktree A 中的提交，Worktree B 瞬间可见。
*   **独立状态**：每个 Worktree 拥有独立的 `HEAD` 指针、暂存区（Index）和物理文件。

### 2. 为什么选择 Worktree 而非 Clone？
| 特性 | Git Clone (多仓库) | Git Worktree (多工作区) |
| :--- | :--- | :--- |
| **磁盘占用** | 高（重复复制整个 .git 历史） | **极低**（仅占用当前检出文件的空间） |
| **创建速度** | 慢（取决于仓库大小/网络） | **毫秒级**（本地指针操作） |
| **同步机制** | 需 `push` / `pull` 同步 | **实时同步**（物理上共享同一个数据库） |
| **适用场景** | 完全隔离的项目备份 | 并行开发、Code Review、AI 代理沙箱 |

### 3. Git Worktree 命令手册

#### 基础管理
建议将 Worktree 目录创建在主项目目录的 **同级** 位置，而非子目录中，以避免被主项目的 `.gitignore` 误判或递归扫描工具干扰。

```bash
# 假设主项目路径为: ~/dev/my-project

# 1. 添加 Worktree 并创建新分支 (推荐)
# 语法: git worktree add -b <新分支名> <新路径> <基准分支>
$ git worktree add -b feat/user-auth ../my-project-auth main

# 2. 添加 Worktree 并检出已有分支
$ git worktree add ../my-project-hotfix release/v1.0

# 3. 查看当前所有 Worktree
$ git worktree list
# 输出:
# /Users/dev/my-project        (main)
# /Users/dev/my-project-auth   (feat/user-auth)
```

#### 清理与维护
当任务完成后，移除 Worktree 不会删除分支代码，仅删除目录映射。

```bash
# 1. 移除 Worktree
$ git worktree remove ../my-project-auth

# 2. 强制清理（当目录被手动删除后，清理无效的引用）
$ git worktree prune
```

---

## Claude Code + Worktree 集成工作流

结合 **Claude Code** 与 **Git Worktree**，我们可以实现一种 **主控-代理（Master-Agent）** 的开发模式。

### 核心痛点解决
直接在主目录运行 Claude Code 存在以下风险：
1.  **上下文污染**：人类开发者切换分支时，Claude 可能会基于错误的文件版本生成代码。
2.  **环境冲突**：AI 安装的依赖或生成的构建产物可能覆盖您的本地配置。
3.  **终端阻塞**：Claude 执行复杂任务时，您的终端被占用，无法并行工作。

### 怎么做？

#### 步骤一：构建“AI 沙箱”目录结构
为项目建立一个统一的文件夹层级，将主仓库与 AI 专用工作区并列放置。

```text
~/Development/
├── my-app-main/          <-- [主控] 人类开发者工作区 (Main Repo)
├── my-app-ai-feature1/   <-- [代理] Claude 任务 1 (Worktree)
└── my-app-ai-fix/        <-- [代理] Claude 任务 2 (Worktree)
```

#### 步骤二：初始化 AI 专用环境
假设我们需要 Claude 对代码库进行大规模重构。

```bash
cd ~/Development/my-app-main

# 为 Claude 创建一个基于 main 分支的独立环境
# 命名规范建议：使用 ai/ 前缀以便于区分分支用途
git worktree add -b ai/refactor-core ../my-app-ai-refactor main
```

#### 步骤三：环境配置与依赖隔离
Worktree 只有代码文件，**没有依赖包（node_modules）和环境变量（.env）**。

```bash
cd ../my-app-ai-refactor

# 1. 复制环境配置 (如果 .env 被 gitignore)
cp ../my-app-main/.env .

# 2. 安装依赖 (因为 node_modules 是物理隔离的)
# 这确保了 AI 的修改不会破坏主目录的依赖树
npm install
```

#### 步骤四：启动 Claude Code 并行开发
现在，您可以启动 Claude 并下达指令，同时回到主目录继续您的工作。

```bash
# 在 my-app-ai-refactor 目录中
claude
```
> **Prompt 示例**：
> "请阅读 `src/utils` 目录下的所有文件。重构数据处理逻辑以提升性能，并编写 Jest 单元测试。每修改一个文件后，请运行 `npm test` 验证。"

此时：
*   **AI 端**：Claude 正在修改代码、运行测试。
*   **主控端**：在 `my-app-main` 目录中，您可以继续开发其他功能，或者进行 Code Review，完全不受 AI 的文件变更影响。

#### 步骤五：验收与合并
当 Claude 提示任务完成：

1.  **AI 端提交**：让 Claude 提交代码，或手动执行 `git commit`。
2.  **主控端合并**：

```bash
cd ../my-app-main
# 拉取 AI 的分支进行合并
git merge ai/refactor-core

# 或者推送到远端发起 Pull Request 进行审查
git push origin ai/refactor-core
```

3.  **资源回收**：
```bash
git worktree remove ../my-app-ai-refactor
```

---

## 高级配置

### 1. 规范化上下文：CLAUDE.md
在项目根目录创建 `CLAUDE.md` 文件，由于所有 Worktree 共享文件内容，Claude 在任何 Worktree 中启动时都会读取此文件。

### 2. 端口冲突管理
如果在多个 Worktree 中同时运行 Web 服务（如 `localhost:3000`），会发生端口冲突。
*   **解决方案**：在 AI 的 `.env` 副本中修改端口号。
    *   主工作区：`PORT=3000`
    *   AI Worktree：`PORT=3001`

### 3. 自动化脚本 (Shell Alias)
可以在 `.zshrc` 或 `.bashrc` 中增加别名，快速创建 AI 环境：

```bash
# 快速创建名为 ai-worker 的 worktree
function git-ai() {
    local branch_name="ai/$1"
    local dir_name="../$(basename $(pwd))-ai-$1"
    git worktree add -b "$branch_name" "$dir_name"
    echo "AI Worktree created at: $dir_name"
    echo "Tip: Don't forget to cp .env and npm install!"
}
```
*使用：`git-ai fix-login` 将自动创建目录和分支。*

### 4. Git Add Commit Command
CLAUDE.md 文件中的内容会在每次启动 Claude Code 会话时自动加载到上下文中，它适合存放项目级的、全局性的背景信息和高频指令。而 .claude/commands/ 中的自定义命令则不会自动加载。它们只有在被用户显式调用时才会生效。这种设计非常适合封装那些非全局、特定场景下才会使用的工作流。

为了避免每次执行 git 等命令时都弹出授权确认，我们可以在 .claude/settings.local.json 文件中配置命令白名单，实现真正的自动化。
```markdown
---
allowed-tools: [Bash(git:*), Read(*), Grep(*), LS(*)]
description: Add and commit with conventional style
version: "1.0.0"
.claude/commands/git-commit.md
---

# Intelligent Git Commit Command

You are creating a git commit with the following features:

- **Default language**: Chinese (中文) for commit messages
- **Conventional Commit style**: Use conventional commit format (type(scope): description)
- **User context integration**: Accept and incorporate user-provided additional context

## Configuration Settings

    default_language: "zh-CN"
    commit_style: "conventional"
    types:
      - feat: 新功能
      - fix: 修复bug
      - docs: 文档更新
      - style: 代码格式调整
      - refactor: 重构
      - perf: 性能优化
      - test: 测试相关
      - build: 构建系统
      - ci: CI/CD配置
      - chore: 其他更改
      - revert: 回滚提交

## Workflow

1. **Analyze current changes**:

   - Run `git status` to check for uncommitted changes
   - Run `git diff --cached` to see staged changes
   - Run `git diff` to see unstaged changes
   - Identify the main type of changes and affected scope

2. **Parse user input**:

   - Check if user provided additional context or specific requirements
   - Extract any specific commit type or scope preferences
   - Consider any attention points mentioned by the user

3. **Generate commit message**:

   - Use conventional commit format: `(): `
   - Write description in Chinese by default
   - Incorporate user's additional context if provided
   - Keep the subject line under 50 characters
   - Add detailed body if needed (wrapped at 72 characters)

4. **Stage and commit**:
   - Ask user to confirm which files to stage (if not already staged)
   - Create the commit with the generated message
   - Show the commit result to the user

## Example Usage

When the user runs `/git-add-commit`, you should:

1. First check the git status and changes
2. Analyze what type of changes were made
3. Generate an appropriate conventional commit message in Chinese
4. If the user provided additional context like "注意性能优化部分", incorporate it
5. Create the commit

## Important Notes

- Always analyze the TARGET directory where the command is run
- Do NOT assume anything about the current directory structure
- Support both staged and unstaged changes
- Allow user to override language or commit style if specified
- Ensure commit messages are meaningful and descriptive

## User Input Parameters

The user can provide additional context in several ways:

- Direct description: Additional text after `/git-add-commit`
- Type override: Specify a different commit type
- Language override: Request English or other language
- Scope specification: Define a specific scope for the commit

Generate appropriate conventional commit messages based on the actual changes in the target repository.
```

```json
// .claude/settings.local.json
{
    "permissions":{
        "allow":[
            "Bash(find:*)",
            "Bash(git add:*)",
            "Bash(git commit:*)",
            "Bash(mkdir:*)",
        ],
        "deny":[]
    }
}
```

---

## 结语

Git Worktree 不仅仅是一个文件管理技巧，它代表了 **开发环境架构** 的一次升级。通过将 Claude Code 隔离在 Worktree 中，我们不仅保护了主分支的稳定性，更实现了工程吞吐量的倍增。这种“人类负责架构与决策，AI 在并行沙箱中负责执行”的模式，将是未来高效能开发的标准配置。