# 📘 Jiajian Blog (新手入门指南)

欢迎！这是一个基于 **React** 构建的现代博客网站。如果你对 React 或编程不太熟悉，不要担心，这份指南会手把手教你如何管理和修改你的博客。

---

## ⚡ 1. 快速上手 (Quick Start)

在开始之前，请确保你已经安装了 [Node.js](https://nodejs.org/) (推荐 18.0 或更高版本)。

### 第一步：启动网站
打开你的终端 (Visual Studio Code 的终端或者系统的 CMD/PowerShell)，运行以下命令：

1.  **安装依赖包** (就像给手机装 APP，这步只做一次)：
    ```bash
    npm install
    ```

2.  **启动开发服务器** (这一步会打开网站预览)：
    ```bash
    npm run dev
    ```

3.  如果一切顺利，你会看到终端显示 `http://localhost:5173`。按住 `Ctrl` 点击那个链接，或者在浏览器输入这个地址，就能看到你的博客了！

---

## 📂 2. 项目结构说明 (我在哪里改什么？)

别被文件夹吓到了，你只需要关注这几个地方：

*   **`src/content/`** 📝
    *   这里存放你的**文章内容**。都是 `.md` (Markdown) 文件。就像写 Word 文档一样简单。
*   **`src/data/posts.ts`** 🗂️
    *   这是**博客的目录**。每当你写了一篇新文章，都需要在这里“注册”一下，告诉网站它的标题、封面图和年份。
*   **`src/components/Header.tsx`** 🏷️
    *   想修改网站左上角的**大标题文字**？就改这里。
*   **`src/App.tsx`** 🏠
    *   这是网站的**首页**布局文件。

---

## ✍️ 3. 教你发一篇新文章

假设你要写一篇关于 "我的 React 学习之旅" 的文章。

### 第一步：写内容
1.  进入 `src/content/` 文件夹。
2.  新建一个文件，命名为 `my-react-journey.md`。
3.  在里面写你的内容：
    ```markdown
    # 我的 React 学习之旅

    这是我的第一篇博客文章！

    ## 什么是 React？
    它很有趣...
    ```

### 第二步：上架 (注册文章)
1.  打开 `src/data/posts.ts`。
2.  **首先，在文件最上面导入你的文章**：
    ```typescript
    // 找到其他的 import，在下面加一行：
    import myJourney from '../content/my-react-journey.md'; 
    // "myJourney" 是你给这篇文章起的代号，随便起，但在下面要用到。
    ```
3.  **然后，在 `posts` 列表中添加信息**：
    找到 `export const posts = [...]`，在方括号里添加一段配置：
    ```typescript
    {
      id: 'react-journey',       // 唯一身份证，不要和别的文章重复
      title: 'React 学习之旅',    // 显示在卡片上的标题
      year: 2025,                // 年份 (网站会根据这个自动分组！)
      date: 'Dec 18',            // 显示的日期
      description: '这是我作为新手的第一篇学习笔记...', // 卡片背面的简介
      coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee', // 封面图链接
      link: '/posts/react-journey', // 网址，格式必须是 /posts/{id}
      content: myJourney,        // <--- 这里填你在第一步导入的代号
    },
    ```
4.  保存文件 (`Ctrl + S`)。回到浏览器，你应该能看到新文章出现了！✨

---

## 🖼️ 4. 图片怎么弄？

你需要为文章提供封面图。有两种最简单的方法：

### 方法 A: 使用网络图片 (推荐新手)
去 [Unsplash](https://unsplash.com/) 找一张好看的图，右键点击图片选择“复制图片地址”，然后粘贴到 `coverImage` 字段里。

### 方法 B: 使用本地图片
1.  把你的图片放到 `public/` 文件夹里 (例如 `public/my-pic.jpg`)。
2.  在代码里，路径直接写 `/my-pic.jpg` (注意：不需要写 public)。

> **💡 美观小贴士**: 
> * 首页卡片最好用 **方形图片 (1:1)**。
> * 文章详情页的头图最好用 **宽屏图片 (16:9)**。

---

## 🚀 5. 把网站发布到网上 (GitHub Pages)

你想让朋友看到你的网站吗？

1.  **修改配置**: 
    打开 `vite.config.ts`，找到 `base: '/jiajian-blog/'`。
    *   如果你的 GitHub 仓库叫 `my-blog`，就改成 `/my-blog/`。
    *   如果你的仓库叫 `你的名字.github.io`，就改成 `/`。

2.  **发布**:
    在终端运行：
    ```bash
    npm run deploy
    ```
    等待它跑完。它会自动把网站打包并上传到 GitHub。

3.  **设置**:
    去 GitHub 仓库页面 -> Settings -> Pages，确保 "Source" 选的是 `gh-pages` 分支。

---

## ❓ 常见问题 (Q&A)

*   **Q: 我改了代码，浏览器没变？**
    *   A: 按 `Ctrl + S` 保存文件了吗？或者试着刷新一下浏览器。

*   **Q: 只有文字没有样式？**
    *   A: 确保你运行了 `npm install`。

*   **Q: 打开文章显示 404？**
    *   A: 检查 `posts.ts` 里的 `link` 字段是不是 `/posts/你的ID`，ID 必须和 `id` 字段一致。

---

希望这份指南对你有帮助！你可以随意修改代码破坏它，反正 Git 可以回退，尽情探索吧！😉
