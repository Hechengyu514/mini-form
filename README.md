# MiniForm — 低代码表单搭建平台

可视化拖拽搭建表单，配置显隐逻辑，一键预览、分享发布并导出 JSON。

## 功能特性

- **拖拽搭建** — 22 种表单组件，从组件库拖入画布或点击即可生成字段，支持画布内排序
- **插件化架构** — 组件注册热插拔，新增字段类型只需在 `registry.ts` 追加定义
- **条件显隐** — 多条件 AND/OR 组合，10 种运算符，实现字段联动
- **撤销/重做** — 命令模式，支持 Ctrl+Z / Ctrl+Y，80 步历史，可查看历史面板并跳转
- **模板系统** — 5 套内置模板 + 自定义模板保存与删除（localStorage 持久化）
- **分享发布** — 生成分享链接与二维码，独立表单填写页
- **数据统计** — ECharts 图表展示提交数据分布（饼图 / 柱状图 / 评分分布）
- **全局设置** — 自定义标题、描述、成功提示、水印、字段序号
- **移动端预览** — 切换 375px 移动端模拟
- **可折叠面板** — 左右侧边栏支持一键折叠，适配不同屏幕

## 组件清单

| 分类 | 组件 |
|------|------|
| 基础 | 单行输入、多行文本、数字输入、开关、星级评分、滑块 |
| 选择 | 单项选择、多项选择、下拉选择、选择矩阵、填空矩阵 |
| 信息 | 日期、时间、地址（省市区级联） |
| 高级 | 电子签名、文件上传、NPS 净推荐值、排序题、富文本 |
| 布局 | 分割线 |
| 操作 | 提交按钮 |

## 技术栈

- **框架** — Vue 3 + TypeScript + Composition API
- **状态管理** — Pinia
- **路由** — Vue Router 4
- **UI 组件库** — Ant Design Vue 4
- **拖拽** — vue-draggable-plus
- **图表** — ECharts
- **二维码** — qrcode
- **构建** — Vite
- **代码规范** — ESLint + Oxlint + Prettier

## 项目结构

```
src/
├── components/
│   ├── editor/          # 编辑器子组件（画布卡片、属性面板、历史/模板/分享弹窗）
│   └── form/            # 22 种表单控件 + 注册表
├── composables/         # 核心逻辑（显隐引擎、校验引擎、撤销重做、数据统计）
├── plugins/             # 插件系统（PluginManager 单例 + 类型定义）
├── stores/              # Pinia Store（编辑器画布、全局设置、提交数据）
├── templates/           # 5 套内置模板 JSON
├── types/               # TypeScript 类型定义
├── utils/               # 工具函数（UUID 生成）
├── views/
│   ├── FormEditor/      # 编辑器主视图（三栏布局）
│   ├── FormRender/      # 分享表单独立页
│   └── Preview/         # 预览模态框
├── router/              # 路由配置
└── assets/styles/       # 全局样式
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查
pnpm type-check

# 生产构建
pnpm build
```

## 架构设计

**插件系统** — `PluginManager` 单例维护组件注册表（`Map<type, PluginComponentDef>`），`FormField` 通过动态 `import()` 按需异步加载 `.vue` 组件。新增组件只需在 `registry.ts` 追加定义。

**撤销/重做** — 命令模式，每个状态变更封装为 `Command { undo(), redo() }`，通过双栈管理操作历史。连续属性编辑自动合并为一个命令，避免逐键回退。历史面板支持点击跳转到任意历史状态。

**数据流** — Editor Store 作为唯一数据源，deep watch 自动持久化到 localStorage。`provide/inject` 实现跨层级通信（SubmitButton 触发表单提交）。

**分享发布** — 发布时表单配置写入 localStorage，通过 `/form/:id` 路由渲染独立填写页，支持二维码扫码访问。

## 说明

本项目为纯前端 Demo，数据存储于浏览器 localStorage，文件上传使用模拟进度。生产环境需对接后端服务。

## License

MIT
