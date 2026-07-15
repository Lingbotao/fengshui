/**
 * 择日工具 · 统一入口
 *
 * 核心功能：
 * 1. 按事项类型 + 日期范围筛选吉日
 * 2. 对每个吉日评分排序
 * 3. 支持单日查询
 *
 * 评分规则（0-100）：
 * - 大吉建除（成、开、定）+50
 * - 黄道日 +20
 * - 事项偏好匹配 +15
 * - 事项禁忌 -30
 * - 大凶建除（破、闭）基础分 10
 */

import {
  JIAN_CHU_DAO,
  MATTER_PREFERRED,
  MATTER_FORBIDDEN,
  type MatterType,
  type JianChu,
  type JianChuLevel,
  type DayEvaluation,
  type ZhaiRiResult,
} from './constants';
import { evaluateDay, formatDate } from './jianChu';

/** 建除基础分 */
const JIAN_CHU_BASE_SCORE: Record<JianChu, number> = {
  建: 50,
  除: 65,
  满: 45,
  平: 50,
  定: 75,
  执: 60,
  破: 15,
  危: 40,
  成: 80,
  收: 60,
  开: 85,
  闭: 20,
};

/** 黄道加分 */
const DAO_BONUS = 15;
/** 黑道减分 */
const DAO_PENALTY = -10;
/** 事项偏好加分 */
const PREFERRED_BONUS = 20;
/** 事项禁忌减分 */
const FORBIDDEN_PENALTY = -50;

/**
 * 计算单日针对指定事项的综合评分
 */
function scoreDay(
  jianChu: JianChu,
  level: JianChuLevel,
  daoType: '黄道' | '黑道',
  matter: MatterType
): number {
  // 基础分已包含吉凶等级（大吉=开 85，凶=危 40，大凶=破 15），
  // 不再重复加 level 加分，避免"开日+大吉"双重计算
  let score = JIAN_CHU_BASE_SCORE[jianChu];

  // 黄道/黑道
  if (daoType === '黄道') score += DAO_BONUS;
  else score += DAO_PENALTY;

  // 事项偏好
  if (MATTER_PREFERRED[matter].includes(jianChu)) {
    score += PREFERRED_BONUS;
  }
  // 事项禁忌
  if (MATTER_FORBIDDEN[matter].includes(jianChu)) {
    score += FORBIDDEN_PENALTY;
  }

  // 范围 0-120（开 85 + 黄道 15 + 偏好 20 = 120）
  return Math.max(0, Math.min(120, score));
}

/**
 * 生成某事项的宜/忌列表（基于当日建除）
 *
 * 规则：与评分逻辑同源，只用 MATTER_PREFERRED / MATTER_FORBIDDEN 表
 * - 建除是该事项的偏好 → 宜
 * - 建除是该事项的禁忌 → 忌
 * - 不再使用 JIAN_CHU_INFO 的通用宜忌（避免与事项偏好冲突）
 */
function buildYiJiList(
  jianChu: JianChu,
  matter: MatterType
): { yi: string[]; ji: string[] } {
  const yi: string[] = [];
  const ji: string[] = [];
  if (MATTER_PREFERRED[matter].includes(jianChu)) {
    yi.push(matter);
  }
  if (MATTER_FORBIDDEN[matter].includes(jianChu)) {
    ji.push(matter);
  }
  return { yi, ji };
}

/**
 * 评估单日（针对特定事项）
 */
export function evaluateDayForMatter(
  year: number,
  month: number,
  day: number,
  matter: MatterType
): DayEvaluation {
  const base = evaluateDay(year, month, day);
  const score = scoreDay(base.jianChu, base.level, base.daoType, matter);
  const { yi, ji } = buildYiJiList(base.jianChu, matter);

  return {
    date: formatDate(year, month, day),
    dayGanZhi: base.dayGanZhi,
    jianChu: base.jianChu,
    daoType: base.daoType,
    level: base.level,
    score,
    yi,
    ji,
    desc: base.desc,
  };
}

/**
 * 列出两个日期间的所有日期
 */
function listDates(startYear: number, startMonth: number, startDay: number,
                   endYear: number, endMonth: number, endDay: number): Array<{ y: number; m: number; d: number }> {
  const dates: Array<{ y: number; m: number; d: number }> = [];
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  if (start > end) return dates;

  const current = new Date(start);
  while (current <= end) {
    dates.push({
      y: current.getFullYear(),
      m: current.getMonth() + 1,
      d: current.getDate(),
    });
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * 核心：根据事项类型在指定日期范围内筛选吉日
 *
 * @param matter 事项类型
 * @param startYear 起始年
 * @param startMonth 起始月
 * @param startDay 起始日
 * @param endYear 结束年
 * @param endMonth 结束月
 * @param endDay 结束日
 * @param minScore 最低分数门槛（默认 60）
 * @param maxResults 最大返回数量（默认 10）
 */
export function findGoodDays(
  matter: MatterType,
  startYear: number, startMonth: number, startDay: number,
  endYear: number, endMonth: number, endDay: number,
  minScore: number = 60,
  maxResults: number = 10
): ZhaiRiResult {
  const dates = listDates(startYear, startMonth, startDay, endYear, endMonth, endDay);

  // 评估每一天
  const allEvaluations: DayEvaluation[] = dates.map(({ y, m, d }) =>
    evaluateDayForMatter(y, m, d, matter)
  );

  // === 调试：打印近 7 天评估明细 ===
  const debugDays = allEvaluations.slice(0, 7);
  console.log(`[择日调试] 事项=${matter} 范围=${formatDate(startYear,startMonth,startDay)}~${formatDate(endYear,endMonth,endDay)} minScore=${minScore}`);
  console.table(debugDays.map((d) => ({
    date: d.date,
    jianChu: d.jianChu,
    daoType: d.daoType,
    level: d.level,
    dayGanZhi: d.dayGanZhi,
    score: d.score,
    yi: d.yi.slice(0, 3).join('、'),
  })));
  console.log('[择日调试] Top 5:', allEvaluations
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((d) => `${d.date}(${d.jianChu},${d.score}分)`)
    .join(' | '));
  // === 调试结束 ===

  // 过滤 + 排序
  const goodDays = allEvaluations
    .filter((d) => d.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return {
    startDate: formatDate(startYear, startMonth, startDay),
    endDate: formatDate(endYear, endMonth, endDay),
    matter,
    goodDays,
    totalDays: allEvaluations.length,
  };
}

/**
 * 列出指定月份每一天的建除值（用于日历展示）
 */
export function listMonthJianChu(year: number, month: number, matter: MatterType = '出行'): DayEvaluation[] {
  const lastDay = new Date(year, month, 0).getDate();
  const dates: Array<{ y: number; m: number; d: number }> = [];
  for (let d = 1; d <= lastDay; d++) {
    dates.push({ y: year, m: month, d });
  }
  return dates.map(({ y, m, d }) => evaluateDayForMatter(y, m, d, matter));
}
