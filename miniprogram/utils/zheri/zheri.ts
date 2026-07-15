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
  JIAN_CHU_INFO,
  MATTER_PREFERRED,
  MATTER_FORBIDDEN,
  MATTER_TO_YIJI_KEYWORD,
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
/** 通用宜忌中该事项被列为"忌"的减分 */
const GENERAL_JI_PENALTY = -30;
/** 通用宜忌中该事项被列为"宜"的加分 */
const GENERAL_YI_BONUS = 10;

/**
 * 判断事项是否匹配 JIAN_CHU_INFO 中的某个关键词
 * 例如 "婚嫁" 匹配 JIAN_CHU_INFO 中的 "嫁娶" 或 "结婚"
 */
function matchMatterToKeyword(matter: MatterType, keyword: string): boolean {
  const keywords = MATTER_TO_YIJI_KEYWORD[matter];
  if (!keywords) return false;
  return keywords.includes(keyword);
}

/**
 * 计算单日针对指定事项的综合评分
 */
function scoreDay(
  jianChu: JianChu,
  level: JianChuLevel,
  daoType: '黄道' | '黑道',
  matter: MatterType
): number {
  let score = JIAN_CHU_BASE_SCORE[jianChu];

  // 黄道/黑道
  if (daoType === '黄道') score += DAO_BONUS;
  else score += DAO_PENALTY;

  // 事项偏好（MATTER_PREFERRED 表）
  if (MATTER_PREFERRED[matter].includes(jianChu)) {
    score += PREFERRED_BONUS;
  }
  // 事项禁忌（MATTER_FORBIDDEN 表）
  if (MATTER_FORBIDDEN[matter].includes(jianChu)) {
    score += FORBIDDEN_PENALTY;
  }

  // ==== 新增：参考 JIAN_CHU_INFO 通用宜忌，与首页 getDailyYiJi 同源 ====
  const jianChuInfo = JIAN_CHU_INFO[jianChu];
  // 通用宜：如果 JIAN_CHU_INFO 的 yi 中包含该事项的关键词，加分
  for (const yiItem of jianChuInfo.yi) {
    if (matchMatterToKeyword(matter, yiItem)) {
      score += GENERAL_YI_BONUS;
      break;
    }
  }
  // 通用忌：如果 JIAN_CHU_INFO 的 ji 中包含该事项的关键词，减分
  for (const jiItem of jianChuInfo.ji) {
    if (matchMatterToKeyword(matter, jiItem)) {
      score += GENERAL_JI_PENALTY;
      break;
    }
  }

  return Math.max(0, Math.min(120, score));
}

/**
 * 生成某事项的宜/忌列表（基于当日建除）
 *
 * 优先级：事项专属偏好 > JIAN_CHU_INFO 通用宜忌
 * 原因：两者可能冲突（如开业 PREFERRED 含「满」+ 满.ji 含「开市」关键字匹配「开业」，
 *      若同时合并会出现「宜开业 + 忌开业」自相矛盾）。以事项专属为准。
 */
function buildYiJiList(
  jianChu: JianChu,
  matter: MatterType
): { yi: string[]; ji: string[] } {
  const yi: string[] = [];
  const ji: string[] = [];

  // 来源1：事项专属偏好（优先级最高）
  const isPreferred = MATTER_PREFERRED[matter].includes(jianChu);
  const isForbidden = MATTER_FORBIDDEN[matter].includes(jianChu);

  if (isPreferred) {
    yi.push(matter);
  }
  if (isForbidden) {
    ji.push(matter);
  }

  // 来源2：JIAN_CHU_INFO 通用宜忌（仅在专属未判定时补充）
  if (!isPreferred && !isForbidden) {
    const jianChuInfo = JIAN_CHU_INFO[jianChu];
    for (const yiItem of jianChuInfo.yi) {
      if (matchMatterToKeyword(matter, yiItem)) {
        yi.push(matter);
        break;
      }
    }
    for (const jiItem of jianChuInfo.ji) {
      if (matchMatterToKeyword(matter, jiItem)) {
        ji.push(matter);
        break;
      }
    }
  }

  return {
    yi: [...new Set(yi)],
    ji: [...new Set(ji)],
  };
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
