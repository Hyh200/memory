# 年度相册网站审查记录表

## 审查规则

- 每个 task 都必须有一条审查记录。
- 只有 `结论=通过` 的 task 才能提交 Git。
- 提交后必须补充 `提交哈希`。
- 提交哈希只能在提交后产生，因此审查通过记录先随 task 提交，提交后立即补写哈希并保存审查记录更新。
- 如果审查发现问题，记录问题并保持该 task 未提交，直到修复并复审通过。

## 审查记录

| Task ID | Task | 审查时间 | 审查项 | 验证证据 | 结论 | 提交哈希 | 备注 |
|---|---|---|---|---|---|---|---|
| T00 | 建立实现计划与审查流程 | 2026-06-15 16:04:46 +08:00 | 计划表覆盖小 task；审查表包含审查字段；主计划写入 Git 保存规则 | 人工审查通过；`git status --short` 显示仅本 task 文档变更 | 通过 | 5d865a3 | 已提交，进入 T01 |
| T01 | 搭建 Next.js 项目骨架 | 2026-06-15 16:09:48 +08:00 | Next.js + TypeScript 骨架；规划文档保留；生成物排除 | `npm install` 通过；`npm run typecheck` 通过；`npm run build` 通过；`git status --short` 未显示 `.next`、`node_modules`、`tsconfig.tsbuildinfo` | 通过 | 5c70ea3 | 已提交，进入 T02 |
| T02 | 建立基础 UI 设计系统 | 2026-06-15 16:16:07 +08:00 | Tailwind v4 集成；全局设计 token；首页基础相册工作台；响应式布局 | `npm run typecheck` 通过；`npm run build` 通过；浏览器桌面/移动 DOM 指标无横向溢出；控制台无 error/warn；截图接口两次超时，未作为通过证据 | 通过 | 60dad2d | 已提交，进入 T03 |
| T03 | 定义本地数据模型 | 2026-06-15 16:22:39 +08:00 | User、Photo、AlbumYear、StyleProfile、CoverAsset 类型；本地 AlbumYearView 数据层；首页接入模型数据 | `npm run typecheck` 通过；`npm run build` 通过；审查确认未引入数据库、上传处理或真实归档算法；`next-env.d.ts` 由 build 自动同步到 `.next/types/routes.d.ts` | 通过 | 23f4325 | 已提交，进入 T04 |
| T04 | 实现照片上传入口 | 2026-06-15 16:30:30 +08:00 | `/upload` 页面；多图文件 input；上传队列；格式和大小错误状态；首页入口 | `npm run typecheck` 通过；`npm run build` 通过；浏览器检查 `/upload` 可访问、input accept/multiple 正确、空队列可见、桌面/移动文档层无横向溢出、控制台无 error/warn | 通过 | 3912741 | 已提交，进入 T05；系统文件选择器注入受限，真实选文件需人工补验 |
| T05 | 实现图片处理基础 | 2026-06-15 16:47:17 +08:00 | MinIO 原图/缩略图存储；Sharp 缩略图；EXIF 年份识别；上传 API；上传队列展示处理结果 | `npm run test` 通过，常规环境 MinIO 测试跳过；临时注入 `ceramics-minio` 凭据后 `npm run test` 通过且实际写入 MinIO；`npm run typecheck` 通过；`npm run build` 通过 | 通过 | 9c50780 | 已提交，进入 T06；补充提交 43cdc99 隐藏上传界面对象 key 并调整默认 ownerId；构建输出存在 sharp 相关 `Couldn't load fs/zlib` 警告但退出码为 0；AWS SDK 对 Node 20 有未来支持周期警告 |
| T05-R | T05 复审 | 2026-06-15 17:05:00 +08:00 | 复核 T05 主提交、补充提交、MinIO 存储、上传 API、上传队列展示和测试记录 | `git status --short` 干净；`docker ps` 确认 `ceramics-minio` 在线；`npm run test` 通过且无凭据时 MinIO 测试跳过；临时注入 `ceramics-minio` 凭据后 `npm run test` 通过且实际写入 MinIO；`npm run typecheck` 通过；`npm run build` 通过 | 通过 | 7f4f1a1 | 复审无阻塞问题，允许进入 T06；仍保留 sharp 构建警告和 AWS SDK Node 20 未来支持周期警告 |
| T06 | 实现年度归档 | 2026-06-15 17:06:00 +08:00 | 本地归档模型；上传成功后保存 processed photo；首页按 resolvedYear 合并既有相册和新增上传年份；年度卡片显示本地新增数量 | `npm run test` 通过，覆盖年度分组和既有/新增年份合并；`npm run typecheck` 通过；`npm run build` 通过；浏览器访问 `http://127.0.0.1:3000/` 相册列表渲染、无横向溢出、控制台无 warn/error | 通过 | df4600c | 构建仍保留 T05 已记录的 sharp `Couldn't load fs/zlib` 警告但退出码为 0；MinIO 对象 key 仅入库不在上传界面展示 |
| T07 | 实现行书封面 | 2026-06-15 17:15:27 +08:00 | 年度封面卡；代表照片源；年份；上传者行书署名；风格主色背景 | `npm run test` 通过，覆盖封面字段、代表照片和署名；`npm run typecheck` 通过；`npm run build` 通过；浏览器访问 `http://127.0.0.1:3000/` 确认 3 个封面卡均有背景图层、年份、风格标签、代表照片名和 `宇浩` 署名，无横向溢出，控制台无 warn/error | 通过 | eafcf9e | 截图接口两次超时，未作为通过证据；构建仍保留 T05 已记录的 sharp `Couldn't load fs/zlib` 警告但退出码为 0 |
| T08 | 实现风格分析与模板映射 | 2026-06-15 17:23:27 +08:00 | Sharp 主色采样；亮度/饱和度计算；主题标签；模板映射；图片处理 API 返回风格结果；上传队列和年度卡片消费风格结果 | `npm run test` 通过，覆盖样例图片风格分析、阈值模板映射、图片处理风格输出、年度卡片应用上传风格；`npm run typecheck` 通过；`npm run build` 通过；浏览器访问 `/` 和 `/upload`，页面渲染正常、无横向溢出、控制台无 warn/error | 通过 | 510c93f | 构建仍保留 T05 已记录的 sharp `Couldn't load fs/zlib` 警告但退出码为 0；MinIO 集成测试无凭据时仍按既有逻辑跳过 |
| T09 | 实现年度相册阅读器 | 2026-06-15 17:34:27 +08:00 | `/albums/[year]` 年度阅读页；首页卡片入口；阅读页生成；实体相册翻页动画；桌面双页；移动单页；首页/上一页/下一页按钮 | `npm run test` 通过，覆盖阅读页生成、上传照片插入、桌面/移动步进和偶数页末页边界；`npm run typecheck` 通过；`npm run build` 通过；浏览器访问 `/albums/2026`，桌面双页、下一页到末页并禁用、上一页返回、移动 390px 单页均通过，无横向溢出，控制台无 warn/error | 通过 | b287d67 | 构建仍保留 T05 已记录的 sharp `Couldn't load fs/zlib` 警告但退出码为 0；本 task 未实现分享链接或权限控制 |
| T10 | 实现分享链接 | 2026-06-16 08:52:19 +08:00 | 生成分享链接；复制分享链接；撤销分享链接；访客只读访问；撤销后不可访问 | `npm run test` 通过，覆盖分享只读 token、managementToken 分离和撤销权限；`npm run typecheck` 通过；`npm run build` 通过；API 手动验证公开 GET 不返回 managementToken、错误 managementToken 撤销为 403、正确撤销后 `/share/{token}` 为 404；浏览器访问只读分享页可阅读相册且无分享/撤销控制，无横向溢出，控制台无 warn/error | 通过 | cfa61ae | 分享记录为当前 Node 进程内存存储，服务重启后失效；分享 URL 只有阅读权限，撤销需创建端持有的 managementToken |
| T11 | 补齐响应式与上传体验 | 2026-06-16 08:59:43 +08:00 | 上传整体进度；单项进度；处理中禁用；错误重试；队列统计；桌面和移动端响应式 | `npm run test` 通过，覆盖上传队列统计和进度钳制；`npm run typecheck` 通过；`npm run build` 通过；浏览器访问 `/upload` 桌面和 390px 移动宽度，上传入口、队列统计、空状态可见，无横向溢出，控制台无 warn/error；浏览器访问 `/` 和 `/albums/2026` 390px 移动宽度，无横向溢出，阅读页首页/上一页/下一页和分享入口可见 | 通过 | 5bf57dd | 构建仍保留 T05 已记录的 sharp `Couldn't load fs/zlib` 警告但退出码为 0；本次使用浏览器响应式 DOM 指标审查，未将截图作为通过证据 |
| T12 | 部署准备 | 2026-06-16 10:14:00 +08:00 | 云服务器 Docker 部署；生产 Compose；Next standalone；环境变量示例；健康检查；Nginx/HTTPS 上线说明；敏感配置排除 | `npm run test` 通过，18 项测试中 17 通过、MinIO 无凭据集成测试跳过；`npm run typecheck` 通过；`npm run build` 通过；`docker compose -f docker-compose.prod.yml --env-file .env.production config --quiet` 通过；`docker build -t annual-photo-album:t12-check .` 通过；本地 `/api/health` 返回 `ok: true`；人工审查 `.gitignore` 排除 `.env.production` 且仓库只提交示例密钥 | 通过 | 49183ae | 构建仍保留 T05 已记录的 sharp `Couldn't load fs/zlib` 警告但退出码为 0；`npm audit --registry=https://registry.npmjs.org --omit=dev` 报 Next 依赖链 2 个 moderate postcss 项，自动修复建议会破坏性降级，未在 T12 中强行处理 |
| T12-Flexus | 优化 Flexus L 宝塔上线文档 | 2026-06-16 10:35:21 +08:00 | 根据本地华为云 Flexus L 宝塔面板最佳实践 HTML 优化 `DEPLOYMENT.md`；覆盖安全组、宝塔初始化、Docker 安装、项目启动、宝塔/Nginx 反代 HTTPS、MinIO Console 隧道、备份回滚 | 读取本地 HTML 和资源目录并提取 Flexus L/宝塔正文要点；`git diff --check` 仅有 Windows LF/CRLF 提示；`docker compose -f docker-compose.prod.yml --env-file .env.production config --quiet` 通过；人工审查文档仅包含占位符密钥，明确不开放 `3000`、`9000`、`9001`、`3306`、`9090` 到公网 | 通过 | 880dd96 | 官方示例会开放 `3306` 和 `9090`，本项目文档按当前架构改为不建议开放；此补充只改部署文档，不改运行时代码 |
