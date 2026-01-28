---
slug: hexo-blog
title: 使用 Hexo 通过 GitHub Pages 搭建博客
year: 2025
date: 2025-10-30
description: 使用Hexo快速搭建个人博客的完整教程。从Node.js环境准备开始，依次介绍hexo-cli安装、hexo init初始化项目、hexo server本地预览、配置hexo-deployer-git插件和_config.yml，最后通过hexo deploy一键部署到GitHub Pages，开启你的博客之旅。
coverImage: /images/Blogs/coverImage.jpg
tags:
  - blogs
  - Hexo
  - Github Pages
categories: 笔记
type: tech
---

使用 Hexo 快速搭建一个功能强大的个人博客。

## 1. 环境准备

在开始之前，请确保电脑上已经安装了 [Node.js](https://nodejs.org/) (推荐使用 LTS 版本) 和 [Git](https://git-scm.com/)。

## 2. Hexo 安装与初始化

1.  **创建博客根目录**
    创建一个文件夹作为博客的根目录，例如 `myblogs`。

2.  **全局安装 Hexo CLI**
    打开终端，执行以下命令来安装 Hexo 命令行工具：
    ```bash
    npm install -g hexo-cli
    ```

3.  **初始化博客项目**
    进入创建的博客根目录，然后执行以下命令来初始化一个新的 Hexo 项目：
    ```bash
    hexo init myblogs
    cd myblogs
    npm install
    ```
    - `hexo init myblogs` 会在当前目录下创建一个名为 `myblogs` 的新文件夹，并下载 Hexo 的基本文件。
    - `cd myblogs` 进入博客项目目录。
    - `npm install` 会根据 `package.json` 文件安装项目所需的依赖。

## 3. 本地预览

本地预览博客效果，只需一行命令：

```bash
hexo server
```

然后用浏览器访问 `http://localhost:4000`，即可看到默认主题下的博客了。

## 4. 部署到 GitHub Pages

1.  **安装 Git 部署插件**
    为了能将博客部署到 GitHub Pages，需要安装 `hexo-deployer-git` 插件：
    ```bash
    npm install hexo-deployer-git --save
    ```

2.  **配置 `_config.yml`**
    打开博客根目录下的 `_config.yml` 文件，在文件末尾找到 `deploy` 配置项，并修改为对应的 GitHub 仓库地址：
    ```yml
    deploy:
      type: git
      repo: <GitHub 仓库地址> # 例如: https://github.com/user/repo.git
      branch: [branch] # 例如: main
    ```

3.  **一键部署**
    依次执行以下命令，完成部署：
    ```bash
    hexo clean      # 清理缓存
    hexo generate   # 生成静态文件
    hexo deploy     # 部署到远端
    ```
    现在，访问 GitHub Pages 地址，就能看到博客了！

## 5. 撰写新文章

1.  **创建新文章**
    执行以下命令来创建一篇新的文章：
    ```bash
    hexo new "我的第一篇文章"
    ```
    这会在 `source/_posts` 目录下生成一个 `我的第一篇文章.md` 文件。

2.  **开始写作**
    使用 Markdown 编辑器打开该文件，即可开始创作。

---