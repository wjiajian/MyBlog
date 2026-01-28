import { defineConfig } from 'tinacms';

// TinaCloud 配置
// 使用环境变量配置 TinaCloud 连接
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  'main';

export default defineConfig({
  branch,

  // TinaCloud 凭证（从环境变量读取）
  // 暂时强制使用本地模式 (Local Mode)
  clientId: process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,

  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },

  media: {
    tina: {
      mediaRoot: 'images',
      publicFolder: 'public',
    },
  },

  // schema 定义：定义 tech 和 life 两个集合
  schema: {
    collections: [
      {
        name: 'tech',
        label: '技术文章',
        path: 'src/content/tech',
        format: 'md',
        fields: [
          {
            type: 'string',
            name: 'slug',
            label: '文章 Slug',
            required: true,
            description: '用于生成 URL 的唯一标识符（旧字段名：id）',
          },
          {
            type: 'string',
            name: 'title',
            label: '标题',
            isTitle: true,
            required: true,
          },
          {
            type: 'number',
            name: 'year',
            label: '年份',
            required: true,
          },
          {
            type: 'datetime',
            name: 'date',
            label: '发布日期',
            required: true,
          },
          {
            type: 'string',
            name: 'description',
            label: '描述',
            ui: {
              component: 'textarea',
            },
          },
          {
            type: 'image',
            name: 'coverImage',
            label: '封面图片',
          },
          {
            type: 'string',
            name: 'tags',
            label: '标签',
            list: true,
          },
          {
            type: 'string',
            name: 'categories',
            label: '分类',
          },
          {
            type: 'string',
            name: 'type',
            label: '类型',
            options: ['tech', 'life'],
            required: true,
          },
          {
            type: 'rich-text',
            name: 'body',
            label: '正文内容',
            isBody: true,
          },
        ],
        ui: {
          filename: {
            readonly: false,
            slugify: (values: { slug?: string }) => {
              return values?.slug || 'new-post';
            },
          },
        },
      },
      {
        name: 'life',
        label: '生活随笔',
        path: 'src/content/life',
        format: 'md',
        fields: [
          {
            type: 'string',
            name: 'slug',
            label: '文章 Slug',
            required: true,
            description: '用于生成 URL 的唯一标识符（旧字段名：id）',
          },
          {
            type: 'string',
            name: 'title',
            label: '标题',
            isTitle: true,
            required: true,
          },
          {
            type: 'number',
            name: 'year',
            label: '年份',
            required: true,
          },
          {
            type: 'datetime',
            name: 'date',
            label: '发布日期',
            required: true,
          },
          {
            type: 'string',
            name: 'description',
            label: '描述',
            ui: {
              component: 'textarea',
            },
          },
          {
            type: 'image',
            name: 'coverImage',
            label: '封面图片',
          },
          {
            type: 'string',
            name: 'categories',
            label: '分类',
          },
          {
            type: 'string',
            name: 'type',
            label: '类型',
            options: ['tech', 'life'],
            required: true,
          },
          {
            type: 'rich-text',
            name: 'body',
            label: '正文内容',
            isBody: true,
          },
        ],
        ui: {
          filename: {
            readonly: false,
            slugify: (values: { slug?: string }) => {
              return values?.slug || 'new-post';
            },
          },
        },
      },
    ],
  },
});
