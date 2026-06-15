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
