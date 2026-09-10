# info-popup 组件设计规格（Design Spec）

**日期:** 2026-09-10
**状态:** 待评审

## Goal

构建一个原生 Web Component `<info-popup>`，用于展示人员/部门信息的层级图：点击节点后弹出该节点（人员/部门）的只读信息面板，同时页面背景被模糊并压暗。应用场景不限于公司组织结构，也涵盖团队成员展示、世界观人物介绍等。视觉极简、直观：白底 + 黑字 + 一个可配置的浅色高亮。

## 架构

- 原生 Custom Element + Shadow DOM，样式与页面隔离。
- 全屏遮罩层：`position: fixed; inset: 0;`，`backdrop-filter: blur(10px)` + 半透明黑色压暗。
- 面板居中（`max-width` 约 440px），移动端（< 640px）全宽贴边。
- 零依赖，单文件可移植；内核不绑定任何框架。

## 视觉 Token

| Token | 值 | 用途 |
|-------|-----|------|
| `bg` | `#FFFFFF` | 主体纯白 |
| `ink` | `#0A0A0A` | 黑色信息（标题/正文/字段值） |
| `muted` | `#6B7280` | 字段标签、次级说明（灰） |
| `line` | `#E7E7E7` | 分割线、层级连接线、边框（浅灰） |
| `accent` | 参数传入，默认 `#E8F0FE` | 浅色高亮（仅作 tint 背景/圆点/焦点环，文字保持黑色） |

- 字体：标题/节点名 = Space Grotesk；正文/字段 = Inter；编号/人数 = IBM Plex Mono。
- 极简方向的精致来自间距、对齐与细节；无阴影堆叠、无渐变、无多余装饰。

## 高亮色参数化

- 属性：`<info-popup accent="#E8F0FE">`
- 方法：`popup.show(nodeData, { accent })`（可选覆盖）
- 优先级：`show()` 的 option > attribute > 默认值
- 内部暴露为 CSS 变量 `--info-popup-accent`

浅色高亮应用于三处（均不影响「黑字白底」主视觉）：
1. 当前/选中节点的浅色 tint 背景 + 细边框；
2. 证件照圆形的细描边（可选）；
3. 键盘焦点环。

## 签名元素

整体「档案/证件」式呈现：圆形证件照 + 居中姓名 + 逐行 `标签: 值` 字段 + 右下角灰色编码，像一份个人档案卡。这是本组件唯一的记忆点，其余保持克制。

## 面板结构（自上而下）

1. 证件照：圆形居中照片（`pic`）。
2. 节点名：居中显示（display 字体）。
3. 字段列表：`[标签]: [值]` 逐行展示 `location → role → since`（标签 muted、值 ink；支持 `_txt` 自定义标签；`location` 可为多条）。
4. 介绍 profile：整段文字。
5. 编码 id：显示框右下角，灰色小字（档案感）。

关闭：面板右上角 × 按钮、点击遮罩、`Esc`（不占用档案主体布局）。

## 数据模型

```js
nodeData = {
  name: string,              // 节点名（必填）
  pic: string,               // 证件照图片 URL（圆形居中显示）
  role: string,              // 职位/角色（人员）
  dept: string,              // 所属
  reportsTo: string[],       // 从属链（从根到父节点名，不含自身）
  type: 'person' | 'dept',
  id?: string,               // 编码（人员），面板右下角灰色显示
  location?: string | string[],  // 地点（可多条）
  location_txt?: string,     // location 的自定义标签，默认「地点」
  role_txt?: string,         // role 的自定义标签，默认「职位」
  since?: string,            // 入职/出生时间
  since_txt?: string,        // since 的自定义标签，默认「时间」
  profile: string            // 介绍（必填）
}
```

标签约定：任意列表字段 `X` 可用 `X_txt` 覆盖其默认标签（适配「工作地点 / 家庭住址」等多种场景）；`location` 可为字符串或字符串数组（数组逐行展示多条）。

## API

- 属性：`accent`（高亮色，默认 `#E8F0FE`）
- 方法：`show(nodeData, options?)` / `hide()`
- 事件：`popup:open`、`popup:close`（可选，便于宿主监听）
- CSS 变量：`--info-popup-accent`

## 交互与无障碍

- 打开：点击节点；关闭：点击遮罩 / `Esc` / 关闭按钮。
- `role="dialog"`、`aria-modal="true"`、`aria-labelledby`（指向节点名标题）。
- 焦点管理：打开时焦点移入面板，关闭时焦点归还触发节点；面板内焦点陷阱。
- 键盘：节点 `tabindex="0"`，`Enter`/`Space` 触发。
- 动效：遮罩淡入 + 模糊渐强，面板轻微上浮（克制缓动）；尊重 `prefers-reduced-motion`。

## 文件结构

```
info-popup.js     # 组件（Shadow DOM、样式、show/hide、焦点/键盘逻辑）
demo.html         # 演示页（一棵约 6 节点的层级图 + 示例数据 + 点击接线）
```

## 测试

- 浏览器手动验证：打开 `demo.html` 检查打开/关闭、背景模糊、汇报链脊柱、响应式、键盘与 Esc、`prefers-reduced-motion`。
- 组件行为：show/hide 后 DOM 状态（面板可见性、aria 属性、焦点位置）的断言（若环境具备 Node 与测试运行器则自动化，否则提供手动清单）。
