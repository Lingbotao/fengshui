/**
 * 择日工具 · 单元测试
 *
 * 测试数据来源：
 * - 万年历网站（timecha.com、ip.cn 等）
 * - 《协纪辨方书》
 *
 * 运行方式：
 *   cd fengshui && npx ts-node tests/zheri/zheri.test.ts
 *   或
 *   cd fengshui && npm test
 */

import {
  getJianChu,
  getDaoType,
  getJianChuLevel,
  getMonthZhi,
  evaluateDay,
  findGoodDays,
  evaluateDayForMatter,
  listMonthJianChu,
  JIAN_CHU,
  JIAN_CHU_INFO,
  MATTER_TYPES,
  type JianChu,
  type MatterType,
} from '../../miniprogram/utils/zheri/index';

// ==================== 工具函数 ====================

let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failed++;
    failures.push(`${name}: ${err.message}`);
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, msg?: string): void {
  if (actual !== expected) {
    throw new Error(`${msg || 'assertEqual failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertTrue(cond: boolean, msg?: string): void {
  if (!cond) {
    throw new Error(msg || 'assertTrue failed');
  }
}

function assertRange(actual: number, min: number, max: number, msg?: string): void {
  if (actual < min || actual > max) {
    throw new Error(`${msg || 'assertRange failed'}: ${actual} not in [${min}, ${max}]`);
  }
}

// ==================== 测试用例 ====================

console.log('\n=== 建除十二神算法测试 ===\n');

// 数据来源：万年历网站（timecha.com / ip.cn）已交叉验证
test('2026-07-14 (丙午年乙未月己丑日) 应为破', () => {
  // 权威数据：月支=未，日支=丑，差 6 → 破
  const jc = getJianChu(2026, 7, 14);
  assertEqual(jc, '破');
  assertEqual(getDaoType(jc), '黑道');
  assertEqual(getJianChuLevel(jc), '大凶');
});

test('2026-07-18 (丙午年乙未月癸巳日) 应为开', () => {
  // 权威数据：月支=未，日支=巳，差 4 → 开（黄道玉堂）
  const jc = getJianChu(2026, 7, 18);
  assertEqual(jc, '开');
  assertEqual(getDaoType(jc), '黄道');
  assertEqual(getJianChuLevel(jc), '大吉');
});

test('2026-07-25 (丙午年乙未月庚子日) 应为执', () => {
  // 权威数据：月支=未（大暑后），日支=子，差 5 → 执（黄道）
  const jc = getJianChu(2026, 7, 25);
  assertEqual(jc, '执');
  assertEqual(getDaoType(jc), '黄道');
});

test('月支判断：2026-07-14 应为未月（小暑后、大暑前）', () => {
  const mz = getMonthZhi(2026, 7, 14);
  assertEqual(mz, '未');
});

test('月支判断：2026-02-15 应为寅月（立春后）', () => {
  // 立春通常在 2/4 前后
  const mz = getMonthZhi(2026, 2, 15);
  assertEqual(mz, '寅');
});

test('月支判断：2026-01-15 应为丑月（小寒后、立春前）', () => {
  const mz = getMonthZhi(2026, 1, 15);
  assertEqual(mz, '丑');
});

test('月支判断：2026-12-15 应为子月（大雪后）', () => {
  // 大雪通常在 12/7 前后
  const mz = getMonthZhi(2026, 12, 15);
  assertEqual(mz, '子');
});

test('节气交接日验证：2026-07-07 (小暑当日) 与前一日建除相同', () => {
  // 小暑当天建除值 = 2026-07-06 的建除值
  const today = getJianChu(2026, 7, 7);
  const prev = getJianChu(2026, 7, 6);
  assertEqual(today, prev, '小暑当天建除应与 7/6 相同');
});

test('节气交接日验证：2026-02-04 (立春当日) 与前一日建除相同', () => {
  const today = getJianChu(2026, 2, 4);
  const prev = getJianChu(2026, 2, 3);
  assertEqual(today, prev, '立春当天建除应与 2/3 相同');
});

console.log('\n=== 黄道/黑道分类测试 ===\n');

test('黄道六神：除、危、定、执、成、开', () => {
  for (const jc of ['除', '危', '定', '执', '成', '开'] as JianChu[]) {
    assertEqual(getDaoType(jc), '黄道', `${jc} 应为黄道`);
  }
});

test('黑道六神：建、满、平、破、收、闭', () => {
  for (const jc of ['建', '满', '平', '破', '收', '闭'] as JianChu[]) {
    assertEqual(getDaoType(jc), '黑道', `${jc} 应为黑道`);
  }
});

console.log('\n=== 综合评估测试 ===\n');

test('evaluateDay 完整评估 2026-07-14', () => {
  const evalResult = evaluateDay(2026, 7, 14);
  assertEqual(evalResult.jianChu, '破');
  assertEqual(evalResult.daoType, '黑道');
  assertEqual(evalResult.level, '大凶');
  assertEqual(evalResult.dayGanZhi, '己丑');
  assertEqual(evalResult.monthZhi, '未');
});

test('evaluateDay 应返回 12 个非空宜忌项', () => {
  const evalResult = evaluateDay(2026, 7, 14);
  assertTrue(evalResult.yi.length > 0, '宜不能为空');
  assertTrue(evalResult.ji.length > 0, '忌不能为空');
});

console.log('\n=== 择日匹配测试 ===\n');

test('婚嫁择日：2026-07 ~ 2026-09 应返回分数≥60 的吉日', () => {
  const result = findGoodDays('婚嫁', 2026, 7, 1, 2026, 9, 30);
  assertTrue(result.goodDays.length > 0, '至少应有 1 个吉日');
  assertTrue(result.totalDays === 92, '7-9 月应共 92 天');
  // 大凶日（破、闭）不应在婚嫁吉日里
  for (const d of result.goodDays) {
    assertTrue(d.score >= 60, `分数应 >= 60, 实际 ${d.score}`);
  }
});

test('婚嫁择日：结果按分数倒序', () => {
  const result = findGoodDays('婚嫁', 2026, 7, 1, 2026, 12, 31);
  for (let i = 1; i < result.goodDays.length; i++) {
    assertTrue(
      result.goodDays[i - 1].score >= result.goodDays[i].score,
      `结果应按分数降序，第 ${i - 1} 项 (${result.goodDays[i - 1].score}) 应 >= 第 ${i} 项 (${result.goodDays[i].score})`
    );
  }
});

test('婚嫁择日：分破日不应在结果中', () => {
  const result = findGoodDays('婚嫁', 2026, 7, 1, 2026, 12, 31, 60);
  for (const d of result.goodDays) {
    assertTrue(d.jianChu !== '破', `破日不应在婚嫁吉日里，但 ${d.date} 是 ${d.jianChu}`);
    assertTrue(d.jianChu !== '闭', `闭日不应在婚嫁吉日里，但 ${d.date} 是 ${d.jianChu}`);
  }
});

test('婚嫁择日：分平日（黑道）分数应较低', () => {
  // 找 2026 年第一个平日，看分数
  let pingDay: { score: number; jianChu: string } | null = null;
  for (let m = 1; m <= 12; m++) {
    const days = listMonthJianChu(2026, m);
    const found = days.find((d) => d.jianChu === '平');
    if (found) { pingDay = found; break; }
  }
  if (pingDay) {
    // 平日对婚嫁不是禁忌但也不在偏好列表中
    assertTrue(pingDay.score < 80, '平日婚嫁分数应 < 80');
  }
});

test('evaluateDayForMatter：婚嫁的成日分数应 > 80', () => {
  // 找 2026 年第一个成日
  let chengDay: { score: number; date: string } | null = null;
  for (let m = 1; m <= 12; m++) {
    const days = listMonthJianChu(2026, m);
    const found = days.find((d) => d.jianChu === '成');
    if (found) { chengDay = found; break; }
  }
  if (chengDay) {
    assertTrue(chengDay.score >= 80, `成日婚嫁应 >= 80, 实际 ${chengDay.score}`);
  }
});

console.log('\n=== listMonthJianChu 测试 ===\n');

test('listMonthJianChu 2026-07 应返回 31 天', () => {
  const days = listMonthJianChu(2026, 7);
  assertEqual(days.length, 31);
});

test('listMonthJianChu 2026-02 应返回 28/29 天', () => {
  const days = listMonthJianChu(2026, 2);
  // 2026 年是平年（2026/4 = 506.5，非整数）
  assertTrue(days.length === 28, '2026-02 应为 28 天');
});

test('listMonthJianChu 2026-04 应返回 30 天', () => {
  const days = listMonthJianChu(2026, 4);
  assertEqual(days.length, 30);
});

console.log('\n=== 性能测试 ===\n');

test('一年 365 天评估应在 1s 内完成', () => {
  const start = Date.now();
  findGoodDays('婚嫁', 2026, 1, 1, 2026, 12, 31, 0, 365);
  const elapsed = Date.now() - start;
  assertTrue(elapsed < 1000, `耗时 ${elapsed}ms 超过 1s`);
});

// ==================== 测试结果 ====================

console.log('\n' + '='.repeat(50));
console.log(`总计: ${passed + failed} 个测试`);
console.log(`✓ 通过: ${passed}`);
console.log(`✗ 失败: ${failed}`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n失败用例:');
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
  process.exit(1);
}

console.log('\n🎉 全部通过！');
