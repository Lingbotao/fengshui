/**
 * 择日算法性能基准测试
 * 测试 zheri-js (编译产物) 的准确性、耗时、内存
 */

const { findGoodDays, evaluateDayForMatter, listMonthJianChu, getJianChu, getMonthZhi, evaluateDay } = require('../miniprogram/utils/zheri-js/index.js');
const { getJieQiTime, hasJieQiTable } = require('../miniprogram/utils/bazi-js/jieqiTable.js');

// ============ 1. 准确性验证 ============
console.log('=== 1. 准确性验证 ===\n');

// 与权威老黄历对照（几个已知日期）
const knownCases = [
  // 2026年7月15日（今天），日柱甲午，月支未（小暑后），建除 = ?
  { year: 2026, month: 7, day: 15, desc: '今天' },
  // 2026年立春（2月3日），节气日，建除应与2月2日相同
  { year: 2026, month: 2, day: 3, desc: '立春（节气日）' },
  { year: 2026, month: 2, day: 2, desc: '立春前一天' },
  // 2026年7月6日（小暑），节气日
  { year: 2026, month: 7, day: 6, desc: '小暑（节气日）' },
  { year: 2026, month: 7, day: 5, desc: '小暑前一天' },
];

console.log('日期           | 日干支 | 月支 | 建除 | 黄道/黑道 | 等级');
console.log('-'.repeat(65));

for (const c of knownCases) {
  const ev = evaluateDay(c.year, c.month, c.day);
  console.log(
    `${c.year}-${String(c.month).padStart(2,'0')}-${String(c.day).padStart(2,'0')}(${c.desc.padEnd(8)}) | ` +
    `${ev.dayGanZhi.padEnd(4)} | ${ev.monthZhi}   | ${ev.jianChu}   | ${ev.daoType}   | ${ev.level}`
  );
}

// 节气日验证：立春和小暑当天应与前一日建除相同
const lichunFeb2 = getJianChu(2026, 2, 2);
const lichunFeb3 = getJianChu(2026, 2, 3);
console.log(`\n✅ 立春节气日验证: 2/2=${lichunFeb2}, 2/3=${lichunFeb3} → ${lichunFeb2 === lichunFeb3 ? '相同 ✓' : '不同 ✗'}`);

const xiaoshuJul5 = getJianChu(2026, 7, 5);
const xiaoshuJul6 = getJianChu(2026, 7, 6);
console.log(`✅ 小暑节气日验证: 7/5=${xiaoshuJul5}, 7/6=${xiaoshuJul6} → ${xiaoshuJul5 === xiaoshuJul6 ? '相同 ✓' : '不同 ✗'}`);

// ============ 2. 节气表覆盖范围 ============
console.log('\n\n=== 2. 节气表覆盖范围 ===');
const years = Object.keys(require('../miniprogram/utils/bazi-js/jieqiTable.js').JIEQI_TABLE).map(Number).sort((a,b)=>a-b);
console.log(`覆盖年份: ${years[0]} ~ ${years[years.length-1]} (共 ${years.length} 年)`);
console.log(`hasJieQiTable(1970): ${hasJieQiTable(1970)}`);
console.log(`hasJieQiTable(2030): ${hasJieQiTable(2030)}`);
console.log(`hasJieQiTable(2031): ${hasJieQiTable(2031)}`);
console.log(`hasJieQiTable(1969): ${hasJieQiTable(1969)}`);

// ============ 3. 性能基准测试 ============
console.log('\n\n=== 3. 性能基准测试 ===');

// 预热
for (let i = 0; i < 10; i++) {
  evaluateDay(2026, 7, 15);
}

function measure(name, fn, iterations = 100) {
  const start = Date.now();
  const startCPU = process.cpuUsage();
  let result;
  for (let i = 0; i < iterations; i++) {
    result = fn();
  }
  const elapsed = Date.now() - start;
  const cpuUsed = process.cpuUsage(startCPU);
  const avgMs = (elapsed / iterations).toFixed(3);
  const avgCPU = (cpuUsed.user / iterations / 1000).toFixed(3);
  console.log(`${name.padEnd(35)} | ${iterations}次 | 总${elapsed}ms | 均${avgMs}ms/次 | CPU均${avgCPU}ms/次`);
  return result;
}

// 单日评估
measure('evaluateDay (单日)', () => evaluateDay(2026, 7, 15), 1000);

// 单日针对事项评估
measure('evaluateDayForMatter (单日)', () => evaluateDayForMatter(2026, 7, 15, '婚嫁'), 1000);

// 单日建除
measure('getJianChu (单日)', () => getJianChu(2026, 7, 15), 1000);

// 单日月支
measure('getMonthZhi (单日)', () => getMonthZhi(2026, 7, 15), 1000);

// 整月建除
const monthResult = measure('listMonthJianChu (整月, 31天)', () => listMonthJianChu(2026, 7, '婚嫁'), 100);
console.log(`  返回 ${monthResult.length} 天建除数据`);

// 3个月择日
const result3m = measure('findGoodDays (3个月, 90天)', () => findGoodDays('婚嫁', 2026, 7, 1, 2026, 9, 30), 100);
console.log(`  范围 ${result3m.totalDays} 天, 找到 ${result3m.goodDays.length} 个吉日`);

// 6个月择日
const result6m = measure('findGoodDays (6个月, 184天)', () => findGoodDays('婚嫁', 2026, 7, 1, 2026, 12, 31), 20);
console.log(`  范围 ${result6m.totalDays} 天, 找到 ${result6m.goodDays.length} 个吉日`);

// 1年择日
const result1y = measure('findGoodDays (1年, 365天)', () => findGoodDays('婚嫁', 2026, 1, 1, 2026, 12, 31), 10);
console.log(`  范围 ${result1y.totalDays} 天, 找到 ${result1y.goodDays.length} 个吉日`);

// ============ 4. 评分逻辑验证 ============
console.log('\n\n=== 4. 评分逻辑验证 ===');

console.log('\n婚嫁 - 近30天评分TOP 5:');
const wedding30 = findGoodDays('婚嫁', 2026, 7, 15, 2026, 8, 14, 0, 5);
for (const d of wedding30.goodDays) {
  console.log(`  ${d.date} ${d.jianChu}(${d.daoType},${d.level}) 评分:${d.score} 日柱:${d.dayGanZhi} 宜:${d.yi.join('/') || '无'} 忌:${d.ji.join('/') || '无'}`);
}

console.log('\n搬家 - 近30天评分TOP 5:');
const move30 = findGoodDays('搬家', 2026, 7, 15, 2026, 8, 14, 0, 5);
for (const d of move30.goodDays) {
  console.log(`  ${d.date} ${d.jianChu}(${d.daoType},${d.level}) 评分:${d.score} 日柱:${d.dayGanZhi} 宜:${d.yi.join('/') || '无'} 忌:${d.ji.join('/') || '无'}`);
}

console.log('\n开业 - 近30天评分TOP 5:');
const biz30 = findGoodDays('开业', 2026, 7, 15, 2026, 8, 14, 0, 5);
for (const d of biz30.goodDays) {
  console.log(`  ${d.date} ${d.jianChu}(${d.daoType},${d.level}) 评分:${d.score} 日柱:${d.dayGanZhi} 宜:${d.yi.join('/') || '无'} 忌:${d.ji.join('/') || '无'}`);
}

// ============ 5. 内存估算 ============
console.log('\n\n=== 5. 内存估算 ===');
const jieqiTable = require('../miniprogram/utils/bazi-js/jieqiTable.js').JIEQI_TABLE;
const tableKeys = Object.keys(jieqiTable);
const tableSize = tableKeys.length;
const entriesPerYear = jieqiTable[tableKeys[0]].length;
const totalEntries = tableSize * entriesPerYear;
const roughBytes = totalEntries * 8; // 每个数字约8字节
console.log(`节气表: ${tableSize} 年 × ${entriesPerYear} 节气/年 = ${totalEntries} 个时间戳`);
console.log(`估算内存: ~${(roughBytes / 1024).toFixed(1)} KB (仅数据，不含对象开销)`);

// 实际 JSON 大小
const tableJson = JSON.stringify(jieqiTable);
console.log(`JSON 序列化大小: ~${(tableJson.length / 1024).toFixed(1)} KB`);

// ============ 6. TS vs JS 默认参数对比 ============
console.log('\n\n=== 6. TS vs JS 默认参数对比 ===');
console.log('⚠️ TS 源: findGoodDays minScore=60, maxResults=10');
console.log('⚠️ JS 编: findGoodDays minScore=70, maxResults=5');
const tsDefault = findGoodDays('婚嫁', 2026, 7, 1, 2026, 9, 30);
console.log(`JS版默认调用结果: ${tsDefault.goodDays.length} 个吉日 (minScore=70, maxResults=5)`);
const tsLikeCall = findGoodDays('婚嫁', 2026, 7, 1, 2026, 9, 30, 60, 10);
console.log(`TS版默认调用结果: ${tsLikeCall.goodDays.length} 个吉日 (minScore=60, maxResults=10)`);

console.log('\n\n=== 测试完成 ===');
