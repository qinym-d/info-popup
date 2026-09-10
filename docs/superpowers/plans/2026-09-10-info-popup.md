# info-popup 组件实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建原生 Web Component `<info-popup>`：点击层级图节点后弹出只读「档案卡」信息面板，背景模糊压暗。

**Architecture:** 纯数据塑形逻辑抽到 `fields.js`（无 DOM、可单测），组件 `info-popup.js` 负责渲染与交互（Shadow DOM），`demo.html` 提供「团队成员」层级图演示。ES Modules，零框架。

**Tech Stack:** 原生 ES Modules；Node v22 内置 `node:test`（`node --test`）；无任何 npm 包。

**Spec:** docs/superpowers/specs/2026-09-10-info-popup-design.md

## Global Constraints

- 零运行时依赖，不引入任何 npm 包。
- 视觉：白底 `#FFFFFF`、黑字 `#0A0A0A`、灰字 `#6B7280`、浅灰线 `#E7E7E7`、高亮色可配置（默认 `#E8F0FE`）。
- 高亮色优先级：`show()` 的 option > `accent` attribute > 默认。
- 尊重 `prefers-reduced-motion`（动效关闭）。
- 单元测试用 `node --test`，无需安装依赖。
- 本机未安装 `git`：计划中所有 `git add` / `git commit` 步骤一律跳过（保持文件即可）。

---

## 文件结构

```
package.json          # { "type": "module" }，让 Node 把 .js 当 ESM 跑测试
fields.js             # 纯函数：normalizeLocation / resolveLabel / buildFieldList（无 DOM）
info-popup.js         # Web Component：Shadow DOM、渲染、交互、焦点/键盘
demo.html             # 演示页：团队成员层级树 + 示例数据 + 点击接线
test/fields.test.js   # fields.js 的单元测试
```

---

## Task 1: 脚手架 + 纯函数 normalizeLocation / resolveLabel

**Files:**
- Create: `package.json`
- Create: `fields.js`
- Test: `test/fields.test.js`

**Interfaces:**
- Produces: `normalizeLocation(location) => string[]`（`undefined` → `[]`；字符串 → 单元素数组；数组 → 去空白/去空项）
- Produces: `resolveLabel(data, field, defaultLabel) => string`（`data[field+'_txt']` 非空则用它，否则用默认）

- [ ] **Step 1: 写 package.json**

```json
{ "type": "module" }
```

- [ ] **Step 2: 写失败测试 `test/fields.test.js`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLocation, resolveLabel } from '../fields.js';

test('normalizeLocation: string -> single-element array', () => {
  assert.deepEqual(normalizeLocation('北京'), ['北京']);
});

test('normalizeLocation: array -> trimmed non-empty array', () => {
  assert.deepEqual(normalizeLocation(['北京', ' 上海 ', '', ' ']), ['北京', '上海']);
});

test('normalizeLocation: undefined -> empty array', () => {
  assert.deepEqual(normalizeLocation(undefined), []);
});

test('resolveLabel: custom _txt wins', () => {
  assert.equal(resolveLabel({ location_txt: '工作地点' }, 'location', '地点'), '工作地点');
});

test('resolveLabel: falls back to default', () => {
  assert.equal(resolveLabel({}, 'role', '职位'), '职位');
});
```

- [ ] **Step 3: 运行测试，确认失败**

Run: `node --test test/fields.test.js`
Expected: FAIL（`Cannot find module '../fields.js'`）

- [ ] **Step 4: 写最小实现 `fields.js`**

```js
export function normalizeLocation(location) {
  if (Array.isArray(location)) {
    return location
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter((v) => v.length > 0);
  }
  if (typeof location === 'string' && location.trim().length > 0) {
    return [location.trim()];
  }
  return [];
}

export function resolveLabel(data, field, defaultLabel) {
  const custom = data?.[`${field}_txt`];
  return typeof custom === 'string' && custom.trim().length > 0
    ? custom.trim()
    : defaultLabel;
}
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `node --test test/fields.test.js`
Expected: PASS（5 passed）

---

## Task 2: buildFieldList

**Files:**
- Modify: `fields.js`
- Test: `test/fields.test.js`

**Interfaces:**
- Produces: `buildFieldList(data) => Array<{ label: string, values: string[] }>`
  - 顺序固定 `location → role → since`；空字段省略；`location` 支持多条值；每条结构统一为 `{label, values}`（`values` 恒为数组）。

- [ ] **Step 1: 追加失败测试**

```js
import { buildFieldList } from '../fields.js';

test('buildFieldList: order location -> role -> since', () => {
  const list = buildFieldList({ role: '前端工程师', location: '北京', since: '2021-03', profile: 'p' });
  assert.deepEqual(list.map((f) => f.label), ['地点', '职位', '时间']);
  assert.deepEqual(list.map((f) => f.values), [['北京'], ['前端工程师'], ['2021-03']]);
});

test('buildFieldList: location array -> multiple values, custom label', () => {
  const list = buildFieldList({ location: ['北京', '上海'], location_txt: '工作地点' });
  assert.deepEqual(list[0], { label: '工作地点', values: ['北京', '上海'] });
});

test('buildFieldList: omits empty fields', () => {
  assert.deepEqual(buildFieldList({ name: 'X', role: '   ', profile: 'p' }), []);
});
```

- [ ] **Step 2: 运行，确认失败**

Run: `node --test test/fields.test.js`
Expected: FAIL（`buildFieldList is not a function` / import 报错）

- [ ] **Step 3: 在 `fields.js` 实现**

```js
function single(value) {
  return typeof value === 'string' && value.trim().length > 0
    ? [value.trim()]
    : [];
}

export function buildFieldList(data) {
  const list = [];

  const locations = normalizeLocation(data?.location);
  if (locations.length > 0) {
    list.push({ label: resolveLabel(data, 'location', '地点'), values: locations });
  }

  const role = single(data?.role);
  if (role.length > 0) {
    list.push({ label: resolveLabel(data, 'role', '职位'), values: role });
  }

  const since = single(data?.since);
  if (since.length > 0) {
    list.push({ label: resolveLabel(data, 'since', '时间'), values: since });
  }

  return list;
}
```

- [ ] **Step 4: 运行，确认通过**

Run: `node --test test/fields.test.js`
Expected: PASS（8 passed）

---

## Task 3: 组件骨架（Shadow DOM + accent 属性）

**Files:**
- Create: `info-popup.js`

**Interfaces:**
- Produces: `class InfoPopup extends HTMLElement`，自定义元素 `<info-popup>`
- `static get observedAttributes()` 返回 `['accent']`
- 内部方法 `_applyAccent()` 把当前 accent 写为宿主上的 CSS 变量 `--info-popup-accent`

- [ ] **Step 1: 写 `info-popup.js`（模板 + 类骨架 + accent 处理）**

```js
import { buildFieldList } from './fields.js';

const DEFAULT_ACCENT = '#E8F0FE';

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host { display: contents; }
  .backdrop {
    position: fixed; inset: 0; z-index: 999;
    background: rgba(0,0,0,0.32);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    padding: 16px; opacity: 0; transition: opacity .18s ease;
  }
  .backdrop[hidden] { display: none; }
  .backdrop.open { opacity: 1; }
  .panel {
    position: relative; background: #FFFFFF; color: #0A0A0A;
    width: 100%; max-width: 420px; border: 1px solid #E7E7E7;
    border-radius: 12px; padding: 24px; text-align: center;
    transform: translateY(8px); transition: transform .18s ease;
    outline: none;
  }
  .backdrop.open .panel { transform: translateY(0); }
  .close {
    position: absolute; top: 12px; right: 12px; width: 32px; height: 32px;
    border: none; background: none; font-size: 20px; line-height: 1;
    color: #6B7280; cursor: pointer; border-radius: 50%;
  }
  .close:hover { background: #F3F4F6; }
  .photo {
    width: 96px; height: 96px; border-radius: 50%; object-fit: cover;
    display: block; margin: 0 auto 12px; border: 3px solid var(--info-popup-accent);
  }
  .name { font-family: "Space Grotesk", sans-serif; font-size: 24px; font-weight: 600; margin: 0 0 16px; }
  .fields { text-align: left; margin: 0 0 16px; border-top: 1px solid #E7E7E7; }
  .field { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #E7E7E7; }
  .field dt { color: #6B7280; font-size: 13px; flex: 0 0 auto; }
  .field dd { margin: 0; font-size: 14px; text-align: right; }
  .profile { text-align: left; font-size: 14px; line-height: 1.6; margin: 0 0 16px; white-space: pre-wrap; }
  .id { position: absolute; right: 12px; bottom: 10px; font-family: "IBM Plex Mono", monospace; font-size: 12px; color: #9CA3AF; }
  @media (max-width: 639px) { .panel { max-width: none; border-radius: 0; } }
  @media (prefers-reduced-motion: reduce) { .backdrop, .panel { transition: none; } }
</style>
<div class="backdrop" hidden>
  <div class="panel" role="dialog" aria-modal="true" aria-labelledby="info-popup-name" tabindex="-1">
    <button class="close" type="button" aria-label="关闭">×</button>
    <img class="photo" alt="" />
    <h2 class="name" id="info-popup-name"></h2>
    <dl class="fields"></dl>
    <p class="profile"></p>
    <span class="id"></span>
  </div>
</div>
`;

export class InfoPopup extends HTMLElement {
  static get observedAttributes() { return ['accent']; }

  constructor() {
    super();
    this._lastFocus = null;
    this._accent = DEFAULT_ACCENT;
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(template.content.cloneNode(true));
    this._backdrop = this.shadowRoot.querySelector('.backdrop');
    this._panel = this.shadowRoot.querySelector('.panel');
    this._close = this.shadowRoot.querySelector('.close');
    this._photo = this.shadowRoot.querySelector('.photo');
    this._name = this.shadowRoot.querySelector('.name');
    this._fields = this.shadowRoot.querySelector('.fields');
    this._profile = this.shadowRoot.querySelector('.profile');
    this._id = this.shadowRoot.querySelector('.id');
  }

  attributeChangedCallback(name, _old, value) {
    if (name === 'accent') {
      this._accent = value || DEFAULT_ACCENT;
      this._applyAccent();
    }
  }

  get accent() { return this._accent; }

  _applyAccent() {
    this.style.setProperty('--info-popup-accent', this._accent);
  }
}

if (typeof customElements !== 'undefined') {
  customElements.define('info-popup', InfoPopup);
}
```

- [ ] **Step 2: 语法自检**

Run: `node --check info-popup.js`
Expected: 无输出（语法正确）

---

## Task 4: show / hide + 内容渲染

**Files:**
- Modify: `info-popup.js`

**Interfaces:**
- Produces: `show(nodeData, options = {})` —— 解析 accent（option > attribute > 默认）、渲染内容、显示遮罩、记录/移动焦点、派发 `popup:open`
- Produces: `hide()` —— 淡出后隐藏、派发 `popup:close`、焦点归还
- Produces: `_render(data)` —— 填充 name/pic/字段列表/profile/id

- [ ] **Step 1: 追加 `_render` / `show` / `hide` 方法到 `InfoPopup` 类**

```js
  show(nodeData, options = {}) {
    const accent = options.accent || this.getAttribute('accent') || DEFAULT_ACCENT;
    this._accent = accent;
    this._applyAccent();
    this._render(nodeData);
    this._lastFocus = document.activeElement;
    this._backdrop.hidden = false;
    requestAnimationFrame(() => this._backdrop.classList.add('open'));
    this.dispatchEvent(new CustomEvent('popup:open'));
    this._panel.focus();
  }

  hide() {
    if (this._backdrop.hidden) return;
    this._backdrop.classList.remove('open');
    const done = () => {
      this._backdrop.hidden = true;
      this.dispatchEvent(new CustomEvent('popup:close'));
      if (this._lastFocus && typeof this._lastFocus.focus === 'function') {
        this._lastFocus.focus();
      }
    };
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce) { done(); } else { setTimeout(done, 190); }
  }

  _render(data) {
    this._name.textContent = data.name ?? '';
    this._photo.src = data.pic ?? '';
    this._photo.alt = data.name ?? '';

    this._fields.innerHTML = '';
    for (const { label, values } of buildFieldList(data)) {
      const row = document.createElement('div');
      row.className = 'field';
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = values.join(' / ');
      row.append(dt, dd);
      this._fields.append(row);
    }

    this._profile.textContent = data.profile ?? '';
    this._id.textContent = data.id ?? '';
  }
```

- [ ] **Step 2: 语法自检**

Run: `node --check info-popup.js`
Expected: 无输出

---

## Task 5: 交互（关闭 + 焦点陷阱）

**Files:**
- Modify: `info-popup.js`

**Interfaces:**
- 关闭：点击 `.close`、点击遮罩空白、`Escape`
- 焦点陷阱：面板内 `Tab` 循环

- [ ] **Step 1: 在类中追加 `connectedCallback`**

```js
  connectedCallback() {
    this._close.addEventListener('click', () => this.hide());
    this._backdrop.addEventListener('click', (e) => {
      if (e.target === this._backdrop) this.hide();
    });
    this.addEventListener('keydown', (e) => {
      if (this._backdrop.hidden) return;
      if (e.key === 'Escape') { this.hide(); return; }
      if (e.key === 'Tab') {
        const focusables = this._panel.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });
  }
```

- [ ] **Step 2: 语法自检**

Run: `node --check info-popup.js`
Expected: 无输出

---

## Task 6: 演示页 demo.html（团队成员层级树）

**Files:**
- Create: `demo.html`

**Interfaces:**
- 一棵约 6 节点的「研发团队」层级树，节点可点/可键盘触发
- 每个节点 `data` 含：`name / pic / role / dept / reportsTo / type / id / location / since / profile`
- 点击节点调用 `popup.show(data)`

- [ ] **Step 1: 写 `demo.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>info-popup 演示：团队成员</title>
<style>
  :root { --accent: #E8F0FE; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, -apple-system, "Segoe UI", sans-serif; background: #FFFFFF; color: #0A0A0A; }
  header { padding: 40px 24px 0; text-align: center; }
  header h1 { font-family: "Space Grotesk", sans-serif; font-size: 28px; margin: 0 0 8px; }
  header p { color: #6B7280; margin: 0 0 24px; }
  .tree { display: flex; justify-content: center; padding: 0 24px 64px; }
  .tree ul { padding-top: 20px; position: relative; display: flex; flex-direction: column; align-items: center; }
  .tree li { list-style: none; display: flex; flex-direction: column; align-items: center; position: relative; padding: 20px 12px 0; }
  /* 连接线：父到子的竖线 + 横向分叉 */
  .tree li::before, .tree li::after {
    content: ''; position: absolute; top: 0; right: 50%;
    border-top: 1px solid #E7E7E7; width: 50%; height: 20px;
  }
  .tree li::after { right: auto; left: 50%; border-left: 1px solid #E7E7E7; }
  .tree li:only-child::before, .tree li:only-child::after { display: none; }
  .tree li:first-child::before, .tree li:last-child::after { border: 0 none; }
  .tree li:last-child::before { border-right: 1px solid #E7E7E7; border-radius: 0 8px 0 0; }
  .tree li:first-child::after { border-radius: 8px 0 0 0; }
  .tree ul ul::before {
    content: ''; position: absolute; top: 0; left: 50%;
    border-left: 1px solid #E7E7E7; width: 0; height: 20px;
  }
  .node {
    border: 1px solid #E7E7E7; background: #FFFFFF; border-radius: 10px;
    padding: 12px 16px; cursor: pointer; font-size: 14px;
    font-family: inherit; color: #0A0A0A; transition: background .15s ease, border-color .15s ease;
  }
  .node:hover, .node:focus-visible { background: var(--accent); border-color: #B9CDF6; outline: none; }
  .node.dept { font-family: "Space Grotesk", sans-serif; font-weight: 600; }
  .node .meta { display: block; font-size: 12px; color: #6B7280; font-weight: 400; }
</style>
</head>
<body>
<header>
  <h1>研发团队</h1>
  <p>点击任意节点查看人员档案（背景模糊）</p>
</header>

<div class="tree" id="tree"></div>
<info-popup id="popup" accent="#E8F0FE"></info-popup>

<script type="module">
  import './info-popup.js';

  function avatar(name, bg) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="${bg}"/><text x="48" y="61" font-size="38" text-anchor="middle" fill="#0A0A0A" font-family="sans-serif">${name[0]}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  const data = {
    name: '研发中心', type: 'dept', pic: avatar('研', '#E8F0FE'), role: '部门', dept: '总部',
    reportsTo: [], location: '北京 · 上海', location_txt: '办公地点', since: '2018-01', profile: '负责公司核心产品的研发与交付。',
    children: [
      { name: '前端组', type: 'dept', pic: avatar('前', '#E8F0FE'), role: '团队', dept: '研发中心',
        reportsTo: ['研发中心'], location: '北京', location_txt: '办公地点', since: '2019-06', profile: '负责 Web 与移动端的界面研发。',
        children: [
          { name: '李然', type: 'person', pic: avatar('李', '#E8F0FE'), role: '前端工程师', dept: '前端组', id: 'ENG-014',
            reportsTo: ['研发中心', '前端组'], location: ['北京', '远程'], location_txt: '办公地点', since: '2021-03',
            profile: '负责组件库与前端工程化，关注可访问性与性能。' },
          { name: '王璐', type: 'person', pic: avatar('王', '#E8F0FE'), role: 'UI 设计师', dept: '前端组', id: 'DSN-007',
            reportsTo: ['研发中心', '前端组'], location: '上海', location_txt: '办公地点', since: '2020-09',
            profile: '负责产品界面与设计系统，注重简洁与一致性。' },
        ]
      },
      { name: '后端组', type: 'dept', pic: avatar('后', '#E8F0FE'), role: '团队', dept: '研发中心',
        reportsTo: ['研发中心'], location: '北京', location_txt: '办公地点', since: '2019-06', profile: '负责服务端与数据平台。',
        children: [
          { name: '张昊', type: 'person', pic: avatar('张', '#E8F0FE'), role: '后端工程师', dept: '后端组', id: 'ENG-021',
            reportsTo: ['研发中心', '后端组'], location: '北京', location_txt: '办公地点', since: '2022-01',
            profile: '负责 API 与数据服务，关注稳定性与可观测性。' },
        ]
      },
    ]
  };

  const popup = document.getElementById('popup');

  function renderNode(node, container) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'node' + (node.type === 'dept' ? ' dept' : '');
    btn.type = 'button';
    btn.textContent = node.name;
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = node.role;
    btn.append(meta);
    btn.addEventListener('click', () => popup.show(node));
    li.append(btn);

    if (node.children && node.children.length) {
      const ul = document.createElement('ul');
      node.children.forEach((child) => renderNode(child, ul));
      li.append(ul);
    }
    container.append(li);
  }

  const rootUl = document.createElement('ul');
  renderNode(data, rootUl);
  document.getElementById('tree').append(rootUl);
</script>
</body>
</html>
```

- [ ] **Step 2: 本地预览提示**（无自动浏览器，需手动打开）

在浏览器打开 `demo.html` 验证交互。

---

## Task 7: 手动验证清单 + 打磨

**Files:** 无新增（如需微调则修改 `info-popup.js` / `demo.html`）

- [ ] **Step 1: 打开 `demo.html`，逐项核对**

- [ ] 点击节点 → 面板打开、背景模糊压暗、圆形证件照/姓名/字段列表/profile/右下角 id 均正确显示
- [ ] 字段顺序为「办公地点 → 职位 → 时间」（label 用 `_txt` 覆盖后显示「办公地点」）
- [ ] 李然节点的「办公地点」显示「北京 / 远程」（多条值）
- [ ] 点遮罩空白 / 点右上角 × / 按 `Esc` 三种方式都能关闭，焦点回到原节点
- [ ] 面板打开时 `Tab` 在面板内循环（焦点陷阱），关闭按钮可聚焦
- [ ] `prefers-reduced-motion` 开启时无位移动画
- [ ] 缩窄窗口至 < 640px，面板全宽贴边
- [ ] 键盘：`Tab` 到节点后按 `Enter` / `Space` 能打开面板

- [ ] **Step 2: 如有偏差，改对应文件并重复上一步**
