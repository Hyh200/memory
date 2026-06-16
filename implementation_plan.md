# 年度相册网站实现计划表

## 执行规则

- 每个 task 必须足够小，能独立审查、验证和回退。
- 每个 task 完成后先审查；审查通过后再提交 Git。
- 每次 Git 提交后，必须在 `review_log.md` 记录 task、审查结果、验证命令和提交哈希。
- 提交哈希只能在提交后产生；先提交已通过审查的 task，再立即补写哈希并保存审查记录更新。
- 审查未通过时，不提交 Git；先修复，再重新审查。
- 一个 task 提交完成后，才能开始下一个 task。

## 状态说明

- `pending`：尚未开始。
- `in_progress`：正在实现。
- `review`：实现完成，等待审查。
- `approved`：审查通过，已允许提交。
- `committed`：已提交 Git，并写入审查记录。
- `blocked`：被问题阻塞。

## Task 表

| ID | Task | 范围 | 验收标准 | 验证方式 | 状态 |
|---|---|---|---|---|---|
| T00 | 建立实现计划与审查流程 | 新增实现计划表、审查记录表，写入 Git 保存规则 | 计划表覆盖 MVP 小任务；审查记录表包含审查状态、验证证据和提交哈希；主计划写入新规则 | 人工审查文档结构；`git status --short` | committed |
| T01 | 搭建 Next.js 项目骨架 | 初始化 Next.js + TypeScript 项目，保留现有规划文档 | 本地能安装依赖；项目包含基础 app 目录和脚本；规划文档不丢失 | `npm install`；`npm run build` | committed |
| T02 | 建立基础 UI 设计系统 | 配置 Tailwind、全局样式、字体变量、基础布局 | 首页呈现高级摄影作品集基调；没有营销式落地页堆砌 | `npm run build`；浏览器响应式审查 | committed |
| T03 | 定义本地数据模型 | 建立 User、Photo、AlbumYear、StyleProfile、CoverAsset 类型和本地数据层 | 类型能表达上传、年份归档、封面和风格模板 | `npm run build`；类型检查 | committed |
| T04 | 实现照片上传入口 | 增加上传页面和文件选择流程 | 支持多图选择；显示上传队列和基础错误状态 | 手动上传测试；`npm run build` | committed |
| T05 | 实现图片处理基础 | 接入 MinIO 原图存储、缩略图生成和照片元数据读取接口 | 能写入 MinIO；能生成展示缩略图；能读取或回退照片年份 | 单元/集成测试；`npm run build` | committed |
| T06 | 实现年度归档 | 按照片年份创建年度相册并展示列表 | 不同年份照片正确分组；缺失 EXIF 时用上传时间 | 手动样例测试；`npm run build` | committed |
| T07 | 实现行书封面 | 年度封面展示年份、代表照片、行书署名 | 封面视觉符合相册风格；可设置上传者署名 | 浏览器截图审查；`npm run build` | committed |
| T08 | 实现风格分析与模板映射 | 提取主色、亮度、饱和度、主题标签并映射模板 | 年度相册能得到稳定 StyleProfile 和模板 | 样例照片测试；`npm run build` | committed |
| T09 | 实现年度相册阅读器 | 接入真实翻页效果，保留首页/上一页/下一页 | 桌面双页、移动单页；按钮行为正确 | 浏览器交互测试；`npm run build` | committed |
| T10 | 实现分享链接 | 生成、复制、撤销年度相册分享链接 | 访客可通过链接观看；撤销后不可访问 | 手动访问测试；`npm run build` | committed |
| T11 | 补齐响应式与上传体验 | 优化移动端、上传进度、加载和错误状态 | 核心流程在桌面和移动端可用 | 浏览器截图审查；`npm run build` | committed |
| T12 | 部署准备 | 添加部署配置、环境变量示例、上线说明 | 项目能按文档部署；敏感配置不入库 | `npm run build`；文档审查 | committed |
| T13 | 收敛相册展示 | 首页默认仅显示今年相册；封面只保留姓名行书；阅读页照片下方不显示信息 | 首页只见今年相册；封面只见“谢淑琴”；照片页只显示照片 | `npm run test`；`npm run build`；浏览器审查 | committed |
| T14 | 移除相册标题文案 | 相册页和首页卡片只显示年份，不显示“春日与海”等标题；首页封面姓名居中 | 可见标题只剩 2026；封面姓名居中 | `npm run test`；`npm run build`；浏览器审查 | committed |

## 当前下一个 Task

计划内 MVP task 已完成；最近补充 T14 标题文案收敛已完成。
