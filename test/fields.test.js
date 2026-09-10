import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLocation, resolveLabel, buildFieldList } from '../fields.js';

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
