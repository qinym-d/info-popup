# info-popup

一个零依赖的原生 Web Component：点击层级图中的节点（人员/部门）后，弹出只读「档案卡」信息面板，同时页面背景被模糊压暗。

视觉极简、直观——白底 + 黑字 + 可配置浅色高亮；面板左侧展示「从属链」，右侧是一份像个人档案的卡片（圆形证件照、居中姓名、逐行 `类型 | 值`、右下角灰色编码）。

## 特性

- **原生 Web Component + Shadow DOM**：样式与页面隔离，零依赖，可嵌入任意框架或纯 HTML
- **背景模糊**：全屏遮罩 `backdrop-filter: blur()` 压暗
- **从属链**：左侧竖排展示 `reportsTo` 层级，当前节点高亮
- **字段列表 `info[]`**：逐行展示 `[type] | [value]`，所有 `|` 竖线严格对齐
- **档案卡风格**：圆形证件照、居中姓名、右下角灰色编码
- **可配置高亮色**：通过 `accent` 属性或 `show()` 参数传入
- **无障碍**：`role="dialog"`、焦点陷阱、`Esc` / 遮罩 / × 关闭、键盘触发
- **动效与响应式**：尊重 `prefers-reduced-motion`，移动端全宽贴边

## 快速开始

直接打开 `demo.html` 即可体验（点击任意成员卡片）。

或在你的页面中引入：

```html
<info-popup id="popup" accent="#E8F0FE"></info-popup>
<script src="fields.js"></script>
<script src="info-popup.js"></script>

<script>
  const popup = document.getElementById('popup');

  popup.show({
    name: '李然',
    pic: 'pic/potato.jpeg',
    dept: '前端组',
    reportsTo: ['研发中心', '前端组'],
    type: 'person',
    id: 'ENG-014',
    info: [
      { type: '职位',      value: '前端工程师' },
      { type: '办公地点', value: ['北京', '远程'] }, // 数组 → 显示为「北京 / 远程」
      { type: '入职时间', value: '2021-03' },
    ],
    profile: '负责组件库与前端工程化，关注可访问性与性能。',
  });
</script>
```

## 数据模型

```js
nodeData = {
  name: string,               // 节点名（必填）
  pic: string,                // 证件照图片 URL（圆形居中显示）
  dept: string,               // 所属
  reportsTo: string[],        // 从属链（从根到父节点名，不含自身）
  type: 'person' | 'dept',    // 节点类型
  id?: string,                // 编码（面板右下角灰色显示）
  info: Array<{
    type: string,             //   标签，如「职位」「办公地点」
    value: string | string[]  //   值；数组以「 / 」拼接
  }>,
  profile: string             // 介绍（必填）
}
```

## API

| 项 | 说明 |
|----|------|
| 属性 `accent` | 高亮色，默认 `#E8F0FE` |
| `show(nodeData, options?)` | 打开面板；`options.accent` 可覆盖高亮色 |
| `hide()` | 关闭面板 |
| 事件 `popup:open` / `popup:close` | 打开 / 关闭时派发 |
| CSS 变量 `--info-popup-accent` | 高亮色内部变量 |

高亮色优先级：`show()` 的 `options.accent` > `accent` 属性 > 默认值。

## 文件结构

```
info-popup.js       组件（Shadow DOM、渲染、焦点/键盘逻辑）
fields.js           纯函数 normalizeInfo（无 DOM，可单测）
demo.html           演示页
test/fields.test.js 单元测试
package.json        空标记（用于 Node 测试）
pic/                示例图片
```

## 测试

```bash
node --test
```

## License

MIT
