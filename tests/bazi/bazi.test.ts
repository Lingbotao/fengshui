/**
 * 八字排盘 · 测试用例
 *
 * 测试数据基于公开权威八字排盘网站（华易网、168大算命等）比对
 * 测试运行：ts-node bazi.test.ts 或 jest
 */

import { paiPan } from '../../miniprogram/utils/bazi/index';
import { calculateFourPillars, getDayPillar } from '../../miniprogram/utils/bazi/pillars';
import { getShiShenByGan } from '../../miniprogram/utils/bazi/shishen';

// ============ 测试用例 ============

interface TestCase {
  name: string;
  birth: { year: number; month: number; day: number; hour: number };
  gender: 'male' | 'female';
  expected: {
    yearGanZhi: string;
    monthGanZhi: string;
    dayGanZhi: string;
    hourGanZhi: string;
  };
}

const TEST_CASES: TestCase[] = [
  // ============ 权威数据（已从 toolkk.com 校对）============
  {
    name: '权威数据1: 2026-07-02 12:00 (toolkk 紫微派)',
    birth: { year: 2026, month: 7, day: 2, hour: 12 },
    gender: 'male',
    expected: {
      yearGanZhi: '丙午',
      monthGanZhi: '甲午',
      dayGanZhi: '丁丑',
      hourGanZhi: '丙午'
    }
  },
  {
    name: '权威数据2: 1988-03-14 09:15 (toolkk 紫微派)',
    birth: { year: 1988, month: 3, day: 14, hour: 9 },
    gender: 'male',
    expected: {
      yearGanZhi: '戊辰',
      monthGanZhi: '乙卯',
      dayGanZhi: '戊辰',
      hourGanZhi: '丁巳'
    }
  },
  {
    name: '权威数据3: 1990-01-01 23:30 (toolkk 紫微派-晚子时算当天)',
    birth: { year: 1990, month: 1, day: 1, hour: 23 },
    gender: 'male',
    expected: {
      yearGanZhi: '己巳',
      monthGanZhi: '丙子',
      dayGanZhi: '乙亥',
      hourGanZhi: '丙子'
    }
  },
  {
    name: '权威数据4: 1971-01-06 22:00 (toolkk 紫微派)',
    birth: { year: 1971, month: 1, day: 6, hour: 22 },
    gender: 'male',
    expected: {
      yearGanZhi: '庚戌',
      monthGanZhi: '戊子',
      dayGanZhi: '丙寅',
      hourGanZhi: '己亥'
    }
  },

  // ============ 立春临界（年柱换年）============
  {
    name: '立春临界: 2025-02-03 22:00 (立春前)',
    birth: { year: 2025, month: 2, day: 3, hour: 22 },
    gender: 'male',
    expected: {
      yearGanZhi: '甲辰', // 立春前仍属甲辰年
      monthGanZhi: '丁丑',
      dayGanZhi: '____',
      hourGanZhi: '____'
    }
  },
  {
    name: '立春临界: 2025-02-03 23:00 (立春后 1 小时)',
    birth: { year: 2025, month: 2, day: 3, hour: 23 },
    gender: 'male',
    expected: {
      yearGanZhi: '乙巳', // 立春后入乙巳年
      monthGanZhi: '戊寅',
      dayGanZhi: '____',
      hourGanZhi: '____'
    }
  }
];

// ============ 测试运行 ============

function runTest(testCase: TestCase): boolean {
  const result = paiPan(
    testCase.birth.year,
    testCase.birth.month,
    testCase.birth.day,
    testCase.birth.hour,
    testCase.gender
  );

  const actual = {
    yearGanZhi: result.pillars.year.gan + result.pillars.year.zhi,
    monthGanZhi: result.pillars.month.gan + result.pillars.month.zhi,
    dayGanZhi: result.pillars.day.gan + result.pillars.day.zhi,
    hourGanZhi: result.pillars.hour.gan + result.pillars.hour.zhi
  };

  console.log(`\n📋 ${testCase.name}`);
  console.log(`   期望：${JSON.stringify(testCase.expected)}`);
  console.log(`   实际：${JSON.stringify(actual)}`);

  const passed = JSON.stringify(actual) === JSON.stringify(testCase.expected);

  if (!passed) {
    console.log(`   ❌ 失败`);
    const diff = Object.keys(testCase.expected).filter(k => actual[k as keyof typeof actual] !== testCase.expected[k as keyof typeof testCase.expected]);
    diff.forEach(k => {
      console.log(`      ${k}: 期望 ${testCase.expected[k as keyof typeof testCase.expected]}, 实际 ${actual[k as keyof typeof actual]}`);
    });
  } else {
    console.log(`   ✅ 通过`);
  }

  return passed;
}

// ============ 详细日志输出 ============

function detailedLog(testCase: TestCase): void {
  const result = paiPan(
    testCase.birth.year,
    testCase.birth.month,
    testCase.birth.day,
    testCase.birth.hour,
    testCase.gender
  );

  console.log(`\n========== ${testCase.name} ==========`);
  console.log('四柱：');
  console.log(`  年柱：${result.pillars.year.gan}${result.pillars.year.zhi}`);
  console.log(`  月柱：${result.pillars.month.gan}${result.pillars.month.zhi}`);
  console.log(`  日柱：${result.pillars.day.gan}${result.pillars.day.zhi}`);
  console.log(`  时柱：${result.pillars.hour.gan}${result.pillars.hour.zhi}`);

  console.log('\n十神（以日干 ${result.summary.dayMaster} 为主）：');
  console.log(`  年干${result.pillars.year.gan}：${result.pillarShiShen.year.ganShiShen}`);
  console.log(`  年支${result.pillars.year.zhi}（本气${result.pillarShiShen.year.cangans[0]?.gan}）：${result.pillarShiShen.year.zhiShiShen}`);
  console.log(`  月干${result.pillars.month.gan}：${result.pillarShiShen.month.ganShiShen}`);
  console.log(`  月支${result.pillars.month.zhi}：${result.pillarShiShen.month.zhiShiShen}`);
  console.log(`  日干${result.pillars.day.gan}：日主（我）`);
  console.log(`  日支${result.pillars.day.zhi}：${result.pillarShiShen.day.zhiShiShen}`);
  console.log(`  时干${result.pillars.hour.gan}：${result.pillarShiShen.hour.ganShiShen}`);
  console.log(`  时支${result.pillars.hour.zhi}：${result.pillarShiShen.hour.zhiShiShen}`);

  console.log('\n五行分布：');
  console.log(`  金：${result.wuXing.count['金']} | 木：${result.wuXing.count['木']} | 水：${result.wuXing.count['水']} | 火：${result.wuXing.count['火']} | 土：${result.wuXing.count['土']}`);
  console.log(`  缺失：${result.wuXing.missing.join('、') || '无'}`);
  console.log(`  最旺：${result.wuXing.strongest} | 最弱：${result.wuXing.weakest}`);

  console.log('\n大运：');
  console.log(`  方向：${result.daYun.direction}`);
  console.log(`  起运：${result.daYun.qiYunAge}岁`);
  console.log(`  步骤：${result.daYun.daYunList.slice(0, 5).map((d: any) => d.ganZhi).join(' → ')}`);
}

// ============ 主函数 ============

function main() {
  console.log('========== 八字排盘算法测试 ==========\n');

  // 详细输出
  TEST_CASES.forEach(detailedLog);

  // 测试对比
  console.log('\n========== 测试结果 ==========');
  let passedCount = 0;
  TEST_CASES.forEach(tc => {
    if (runTest(tc)) passedCount++;
  });
  console.log(`\n通过：${passedCount}/${TEST_CASES.length}`);
}

main();