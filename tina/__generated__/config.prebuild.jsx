// tina/config.ts
import { defineConfig } from "tinacms";
var branch = process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || process.env.HEAD || "main";
var config_default = defineConfig({
  branch,
  // TinaCloud 凭证（从环境变量读取）
  clientId: process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public"
    }
  },
  // schema 定义：定义 tech 和 life 两个集合
  schema: {
    collections: [
      {
        name: "tech",
        label: "\u6280\u672F\u6587\u7AE0",
        path: "src/content/tech",
        format: "md",
        fields: [
          {
            type: "string",
            name: "slug",
            label: "\u6587\u7AE0 Slug",
            required: true,
            description: "\u7528\u4E8E\u751F\u6210 URL \u7684\u552F\u4E00\u6807\u8BC6\u7B26\uFF08\u65E7\u5B57\u6BB5\u540D\uFF1Aid\uFF09"
          },
          {
            type: "string",
            name: "title",
            label: "\u6807\u9898",
            isTitle: true,
            required: true
          },
          {
            type: "number",
            name: "year",
            label: "\u5E74\u4EFD",
            required: true
          },
          {
            type: "datetime",
            name: "date",
            label: "\u53D1\u5E03\u65E5\u671F",
            required: true
          },
          {
            type: "string",
            name: "description",
            label: "\u63CF\u8FF0",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "image",
            name: "coverImage",
            label: "\u5C01\u9762\u56FE\u7247"
          },
          {
            type: "string",
            name: "tags",
            label: "\u6807\u7B7E",
            list: true
          },
          {
            type: "string",
            name: "categories",
            label: "\u5206\u7C7B"
          },
          {
            type: "string",
            name: "type",
            label: "\u7C7B\u578B",
            options: ["tech", "life"],
            required: true
          },
          {
            type: "rich-text",
            name: "body",
            label: "\u6B63\u6587\u5185\u5BB9",
            isBody: true
          }
        ],
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              return values?.slug || "new-post";
            }
          }
        }
      },
      {
        name: "life",
        label: "\u751F\u6D3B\u968F\u7B14",
        path: "src/content/life",
        format: "md",
        fields: [
          {
            type: "string",
            name: "slug",
            label: "\u6587\u7AE0 Slug",
            required: true,
            description: "\u7528\u4E8E\u751F\u6210 URL \u7684\u552F\u4E00\u6807\u8BC6\u7B26\uFF08\u65E7\u5B57\u6BB5\u540D\uFF1Aid\uFF09"
          },
          {
            type: "string",
            name: "title",
            label: "\u6807\u9898",
            isTitle: true,
            required: true
          },
          {
            type: "number",
            name: "year",
            label: "\u5E74\u4EFD",
            required: true
          },
          {
            type: "datetime",
            name: "date",
            label: "\u53D1\u5E03\u65E5\u671F",
            required: true
          },
          {
            type: "string",
            name: "description",
            label: "\u63CF\u8FF0",
            ui: {
              component: "textarea"
            }
          },
          {
            type: "image",
            name: "coverImage",
            label: "\u5C01\u9762\u56FE\u7247"
          },
          {
            type: "string",
            name: "categories",
            label: "\u5206\u7C7B"
          },
          {
            type: "string",
            name: "type",
            label: "\u7C7B\u578B",
            options: ["tech", "life"],
            required: true
          },
          {
            type: "rich-text",
            name: "body",
            label: "\u6B63\u6587\u5185\u5BB9",
            isBody: true
          }
        ],
        ui: {
          filename: {
            readonly: false,
            slugify: (values) => {
              return values?.slug || "new-post";
            }
          }
        }
      }
    ]
  }
});
export {
  config_default as default
};
