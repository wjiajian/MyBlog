# OSS 照片墙实施手册（OneDrive 同步版）

本手册是 MyBlog 项目中“照片墙切换到 OSS + OneDrive 自动同步”的独立说明。

## 1. 目标与结论

1. 照片来源统一放在 OneDrive 指定目录。
2. 后端同步服务自动将照片同步到 OSS（并生成 full/medium/tiny）。
3. 前台照片墙从 OSS 读取图片。
4. Admin 后台不再负责上传/处理图片，只负责“是否展示在照片墙”的开关管理。

## 2. 当前实现范围

已实现能力：

1. OneDrive 增量同步（Delta）。
2. OneDrive Webhook 回调触发同步。
3. 定时轮询补偿（防漏通知）。
4. OSS 上传（JPEG 全量统一输出）。
5. metadata 自动更新。
6. 后台按“年月”列出照片并可单图开关展示状态。
7. Gallery 仅展示 `isVisible !== false` 的图片。

暂未实现：

1. Live Photo 视频自动同步（`videoSrc` 仍不自动生成）。
2. 多实例分布式锁（单实例场景可用，多实例建议后续补锁）。

## 3. 架构与数据流

```text
OneDrive (source folder)
  ├─ Graph Webhook -> /api/onedrive-sync/webhook
  └─ Delta Polling -> scheduler
                     ↓
              Sync Service
  - 拉增量项
  - 下载源图
  - 转换为 JPEG
  - 生成 full/medium/tiny
  - 上传 OSS
  - 更新 images-metadata.json
  - 更新 DB cursor/state
                     ↓
OSS (photowall/thumbnails/*)
                     ↓
Gallery / Admin
```

## 4. 核心目录约定

OSS 对象路径：

1. `photowall/thumbnails/full/<basename>.jpg`
2. `photowall/thumbnails/medium/<basename>.jpg`
3. `photowall/thumbnails/tiny/<basename>.jpg`

`basename` 规则：

1. 默认取 OneDrive 文件名去扩展名。
2. 如发生冲突，追加 `-<driveItemId前8位>`。

## 5. 关键环境变量

必须项（同步服务）：

1. `ONEDRIVE_SYNC_ENABLED=true`
2. `ONEDRIVE_TENANT_ID`
3. `ONEDRIVE_CLIENT_ID`
4. `ONEDRIVE_CLIENT_SECRET`
5. `ONEDRIVE_DRIVE_ID`
6. `OSS_REGION`
7. `OSS_BUCKET`
8. `OSS_ACCESS_KEY_ID`
9. `OSS_ACCESS_KEY_SECRET`

建议项：

1. `ONEDRIVE_SOURCE_FOLDER_PATH=PhotoWall`
2. `ONEDRIVE_SYNC_POLL_INTERVAL_SECONDS=600`
3. `ONEDRIVE_WEBHOOK_URL=https://<your-domain>/api/onedrive-sync/webhook`
4. `ONEDRIVE_WEBHOOK_CLIENT_STATE=<random-string>`
5. `ONEDRIVE_SUBSCRIPTION_RENEW_BEFORE_MINUTES=720`

前端/读取域名：

1. `OSS_PHOTOWALL_BASE_URL=https://<oss-or-cdn-domain>`
2. `VITE_OSS_PHOTOWALL_BASE_URL=https://<oss-or-cdn-domain>`

## 6. 微软端详细配置（Microsoft Entra + Graph）

### 6.1 是否需要付费

结论：

1. 仅用于本项目的 Entra 应用注册、Graph API 调用，不要求额外购买 Entra P1/P2。
2. 使用 Microsoft Entra ID Free 即可完成应用注册与权限配置。
3. 你仍需为同步账号提供 OneDrive 可用许可（例如 Microsoft 365 中含 OneDrive 的许可证）。

参考：

1. Entra Free 能力与说明：https://www.microsoft.com/en-us/security/business/microsoft-entra-pricing

### 6.2 个人账号固定方案（本项目推荐）

你当前是个人 Microsoft 账号（MSA），建议固定采用下面这条链路：

1. 授权模式：`refresh_token`（委托权限）。
2. `ONEDRIVE_TENANT_ID=consumers`。
3. 权限只配 `Delegated permissions`（`Files.Read` + `offline_access`）。
4. `ONEDRIVE_REFRESH_TOKEN` 必填。

说明：

1. 本项目默认订阅资源是 `/drives/{driveId}/root`。
2. 目录过滤范围由 `ONEDRIVE_SOURCE_FOLDER_PATH` 控制（同步时仍只处理该目录增量）。

参考：

1. 授权端点租户参数（含 `consumers`）：https://learn.microsoft.com/zh-cn/entra/identity-platform/v2-oauth2-auth-code-flow
2. 订阅资源与权限矩阵：https://learn.microsoft.com/en-us/graph/api/subscription-post-subscriptions?view=graph-rest-1.0
3. 资源生命周期与最大订阅时长：https://learn.microsoft.com/en-us/graph/api/resources/subscription?view=graph-rest-1.0

### 6.3 创建 Entra 应用（个人账号）

1. 打开 Entra 管理中心：https://entra.microsoft.com
2. 进入 `Identity` -> `Applications` -> `App registrations` -> `New registration`。
3. 名称建议：`myblog-onedrive-sync-prod`（或按环境区分）。
4. `Supported account types` 选择：
   1. `Accounts in any organizational directory and personal Microsoft accounts`（必须包含 personal accounts）。
5. `Redirect URI`（必须配置，用于拿授权码）：
   1. 类型建议 `Web`。
   2. 示例：`https://localhost:53682/callback`（你也可以用自己的 HTTPS 回调地址）。
6. 创建后记录：
   1. `Application (client) ID` -> `ONEDRIVE_CLIENT_ID`
   2. 个人账号场景 `ONEDRIVE_TENANT_ID` 固定写 `consumers`（不填目录 tenant GUID）。

### 6.4 创建 Client Secret

1. 进入应用的 `Certificates & secrets`。
2. `New client secret`，设置有效期。
3. 创建后立即复制 `Value`（不是 Secret ID）。
4. 填入 `ONEDRIVE_CLIENT_SECRET`。

注意：Secret 的 `Value` 只显示一次，丢失需新建。

### 6.5 配置 Graph API 权限（个人账号）

1. `Microsoft Graph` -> `Delegated permissions`。
2. 添加 `Files.Read`。
3. 添加 `offline_access`（用于获取 refresh token）。
4. 首次授权时完成用户同意。

不建议：

1. 个人账号场景下，不要按本项目走 `Application permissions + client_credentials`，会与当前推荐路径不一致。

参考：

1. 权限总表（含 `Files.Read`、`offline_access`）：https://learn.microsoft.com/en-us/graph/permissions-reference

### 6.6 获取 `ONEDRIVE_REFRESH_TOKEN`（个人账号必做）

#### 第 1 步：生成授权 URL 并登录同意

将下面参数替换后在浏览器打开：

```text
https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize
  ?client_id=<ONEDRIVE_CLIENT_ID>
  &response_type=code
  &redirect_uri=<URL编码后的RedirectURI>
  &response_mode=query
  &scope=offline_access%20Files.Read
  &state=onedrive-sync
  &prompt=consent
```

同意后会跳转到 `redirect_uri`，地址里带 `code=...`。

#### 第 2 步：用授权码换 refresh token

```bash
curl -X POST "https://login.microsoftonline.com/consumers/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=<ONEDRIVE_CLIENT_ID>" \
  -d "client_secret=<ONEDRIVE_CLIENT_SECRET>" \
  -d "grant_type=authorization_code" \
  -d "code=<上一步拿到的code>" \
  -d "redirect_uri=<与授权时完全一致的RedirectURI>" \
  -d "scope=offline_access Files.Read"
```

响应里取 `refresh_token`，填入 `ONEDRIVE_REFRESH_TOKEN`。

参考：

1. 授权码流程（v2）：https://learn.microsoft.com/zh-cn/entra/identity-platform/v2-oauth2-auth-code-flow

### 6.7 获取 `ONEDRIVE_DRIVE_ID`

推荐方式（Graph Explorer）：

1. 打开：https://developer.microsoft.com/en-us/graph/graph-explorer
2. 用目标 OneDrive 账号登录并同意权限。
3. 请求：
```http
GET https://graph.microsoft.com/v1.0/me/drive
```
4. 响应中的 `id` 即 `ONEDRIVE_DRIVE_ID`。

企业场景可用：
```http
GET https://graph.microsoft.com/v1.0/users/{userPrincipalName}/drive
```

说明：

1. `GET /me/drive` 是委托上下文，不能用于应用权限 token。
2. 你可以先用委托方式查出 driveId，再回填到服务端 `.env` 供后续同步使用。

参考：

1. Drive 获取 API：https://learn.microsoft.com/en-us/graph/api/drive-get?view=graph-rest-1.0

### 6.8 配置 Webhook 回调（可选但强烈建议）

1. 将服务公网可达地址配置到：
   1. `ONEDRIVE_WEBHOOK_URL=https://<your-domain>/api/onedrive-sync/webhook`
2. 可选设置：
   1. `ONEDRIVE_WEBHOOK_CLIENT_STATE=<随机高熵字符串>`
3. 要求：
   1. 必须 HTTPS 公网地址。
   2. Microsoft Graph 验证时会附带 `validationToken`，你的接口需在 10 秒内原样返回纯文本 token。
4. 本项目已实现 `GET/POST /api/onedrive-sync/webhook` 的验证响应。

参考：

1. Webhook 交付与验证要求：https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks

### 6.9 与本项目 `.env` 的一一映射（个人账号示例）

```dotenv
ONEDRIVE_SYNC_ENABLED=true
ONEDRIVE_TENANT_ID=consumers
ONEDRIVE_CLIENT_ID=<Application client ID>
ONEDRIVE_CLIENT_SECRET=<Client secret value>
ONEDRIVE_DRIVE_ID=<drive id>
ONEDRIVE_SOURCE_FOLDER_PATH=PhotoWall

# 个人账号必填
ONEDRIVE_REFRESH_TOKEN=<refresh_token>
ONEDRIVE_REFRESH_SCOPE=Files.Read offline_access

# 可选（Webhook）
ONEDRIVE_WEBHOOK_URL=https://<your-domain>/api/onedrive-sync/webhook
ONEDRIVE_WEBHOOK_CLIENT_STATE=<random-string>

# 可选（默认自动使用 /drives/{driveId}/root）
ONEDRIVE_SUBSCRIPTION_RESOURCE=
ONEDRIVE_SUBSCRIPTION_RENEW_BEFORE_MINUTES=720
```

### 6.10 首次连通性检查（微软侧）

1. 启动后访问（管理员登录态）：
   1. `GET /api/onedrive-sync/status`
2. 若配置了 webhook，执行：
   1. `POST /api/onedrive-sync/subscription/renew`
3. 成功标准：
   1. 返回 `subscriptionId`。
   2. `state.subscription_expiration` 有值。
   3. `state.last_error` 为空。

### 6.11 常见微软侧报错定位

1. `AADSTS7000215 Invalid client secret`：
   1. `ONEDRIVE_CLIENT_SECRET` 填错，或用了 Secret ID 而不是 Secret Value。
2. `AADSTS700016 Application not found`：
   1. `ONEDRIVE_CLIENT_ID` 或 `ONEDRIVE_TENANT_ID` 错误。
3. `invalid_grant`（refresh token 模式）：
   1. refresh token 失效/撤销，需重新获取并更新 `ONEDRIVE_REFRESH_TOKEN`。
4. `403 Insufficient privileges`：
   1. Graph 权限没配对（个人账号应为 Delegated `Files.Read` + `offline_access`）。
5. Webhook 验证失败：
   1. 回调地址非公网 HTTPS。
   2. 未在 10 秒内返回 `validationToken` 明文。
6. 登录后提示账号类型不支持：
   1. 回到应用注册检查 `Supported account types`，必须包含 `personal Microsoft accounts`。

## 7. 部署步骤（推荐顺序）

1. 安装依赖：
```bash
npm install
```

2. 初始化数据库：
```bash
npm run db:init
```

3. 构建：
```bash
npm run build
npm run build:server
```

4. 启动：
```bash
npm run serve
```

5. 首次启动后服务会自动：
1. 校验同步配置。
2. 初始化同步状态表。
3. 尝试创建/续订订阅（若配置了 webhook）。
4. 触发一次 `startup` 同步。

## 8. 数据库表说明

### 8.1 `onedrive_sync_state`

用途：保存同步游标和订阅状态。

关键字段：

1. `folder_item_id`
2. `delta_link`
3. `subscription_id`
4. `subscription_expiration`
5. `last_synced_at`
6. `last_error`

### 8.2 `onedrive_sync_items`

用途：保存 OneDrive 文件索引与幂等信息。

关键字段：

1. `drive_item_id`（PK）
2. `filename`
3. `base_name`
4. `etag`
5. `last_modified_at`

### 8.3 `photo_visibility`

用途：保存照片“是否展示”状态。

关键字段：

1. `photo_key`（PK，格式 `drive:<id>` 或 `file:<filename>`）
2. `is_visible`（布尔）
3. `updated_at`

## 9. API 说明

### 9.1 同步服务 API

1. `GET /api/onedrive-sync/webhook`
   1. Graph 验证入口（返回 `validationToken`）。
2. `POST /api/onedrive-sync/webhook`
   1. Graph 通知入口，接收后排队同步。
3. `GET /api/onedrive-sync/status`（需管理员 token）
   1. 返回运行态、配置态、DB 状态。
4. `POST /api/onedrive-sync/run`（需管理员 token）
   1. 手动触发同步。
5. `POST /api/onedrive-sync/subscription/renew`（需管理员 token）
   1. 手动强制续订订阅。

### 9.2 照片可见性 API

1. `GET /api/photos/metadata`
   1. 默认仅返回可见图片。
2. `GET /api/photos/metadata?includeHidden=1`
   1. 返回全部图片（Admin 使用）。
3. `PATCH /api/photos/visibility`（需管理员 token）
   1. 入参：
```json
{
  "filename": "IMG_20250101_123000.jpg",
  "driveItemId": "01ABCDEF...",
  "isVisible": false
}
```

## 10. Admin 使用流程（重构后）

1. 打开 Admin 照片管理页。
2. 页面按年月分组展示照片。
3. 点击每张图的按钮切换：
   1. `展示中（点击隐藏）`
   2. `已隐藏（点击展示）`
4. 刷新按钮会重新拉取 `includeHidden=1` 数据。

说明：

1. 该页面不再提供上传/处理入口。
2. 照片增删改请在 OneDrive 源目录完成。

## 11. 上线验证清单

1. OneDrive 新增图片 -> OSS 三个缩略图出现。
2. OneDrive 修改图片 -> OSS 对象刷新。
3. OneDrive 删除图片 -> metadata 清理，OSS 对应对象删除。
4. Admin 切换“隐藏”后，Gallery 页面不再显示该图片。
5. Admin 切回“展示”后，Gallery 恢复显示。
6. `GET /api/onedrive-sync/status` 中 `last_error` 为空。

## 12. 故障排查

1. `Missing config`：
   1. 检查 `ONEDRIVE_*` 和 `OSS_*` 是否齐全。
2. Token 失败：
   1. 校验 Tenant/Client/Secret。
   2. 校验 Graph 权限和同意状态。
3. 无法收到 Webhook：
   1. 校验 `ONEDRIVE_WEBHOOK_URL` 可公网访问。
   2. 检查反向代理规则。
   3. 手动调用 `/api/onedrive-sync/subscription/renew`。
4. Gallery 仍显示隐藏图：
   1. 确认 Gallery 请求的是 `/api/photos/metadata`（不带 `includeHidden=1`）。
   2. 清理缓存后重试。

## 13. 回滚方案

1. 停同步：`ONEDRIVE_SYNC_ENABLED=false`，重启服务。
2. 保持 OSS 读取：保留 `OSS_PHOTOWALL_BASE_URL` 与 `VITE_OSS_PHOTOWALL_BASE_URL`。
3. 回退本地读取：
   1. 清空 OSS 读取域名变量。
   2. 重新构建并部署。
