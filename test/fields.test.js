const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeInfo } = require('../fields.js');

test('normalizeInfo: returns normalized list', () => {
  const out = normalizeInfo([
    { type: '办公地点', value: '北京' },
    { type: '职位', value: '前端工程师' },
    { type: '入职时间', value: '2021-03' },
  ]);
  assert.deepEqual(out, [
    { type: '办公地点', value: '北京' },
    { type: '职位', value: '前端工程师' },
    { type: '入职时间', value: '2021-03' },
  ]);
});

test('normalizeInfo: array value joins with " / "', () => {
  const out = normalizeInfo([{ type: '办公地点', value: ['北京', '远程'] }]);
  assert.deepEqual(out, [{ type: '办公地点', value: '北京 / 远程' }]);
});

test('normalizeInfo: trims and drops empty/invalid items', () => {
  const out = normalizeInfo([
    { type: ' 职位 ', value: ' 前端 ' },
    { type: '', value: 'x' },
    { type: '时间', value: '   ' },
    null,
  ]);
  assert.deepEqual(out, [{ type: '职位', value: '前端' }]);
});

test('normalizeInfo: non-array -> empty array', () => {
  assert.deepEqual(normalizeInfo(undefined), []);
});
