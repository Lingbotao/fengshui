/**
 * 择日工具 · 建除十二神算法
 *
 * 算法原理（来源：《协纪辨方书》《淮南子·天文训》）：
 * 1. 月支 = 当前节气月地支（用 bazi 的 24 节气表判断）
 * 2. 建日 = 日支 == 月支
 * 3. 从建日起按"建除满平定执破危成收开闭"顺序每日顺行
 * 4. 节气交接日（节）当天的建除值与前一日相同
 *
 * 黄道/黑道划分（口诀）：
 *   建满平收黑，除危定执黄；
 *   成开皆可用，闭破不相当。
 */

import { JIAN_CHU, JIAN_CHU_INFO, JIAN_CHU_DAO, type JianChu, type JianChuLevel, type DaoType } from './constants';
import { getDayPillar } from '../bazi/pillars';
import { DI_ZHI, getZhiIndex } from '../bazi/constants';
import { getJieQiTime } from '../bazi/jieqiTable';

/** 节气月地支映射（与 bazi/pillars.ts 中保持一致） */
const JIEQI_MONTH_ZHI: Array<{ name: string; zhi: string }> = [
  { name: '小寒', zhi: '丑' },
  { name: '立春', zhi: '寅' },
  { name: '惊蛰', zhi: '卯' },
  { name: '清明', zhi: '辰' },
  { name: '立夏', zhi: '巳' },
  { name: '芒种', zhi: '午' },
  { name: '小暑', zhi: '未' },
  { name: '立秋', zhi: '申' },
  { name: '白露', zhi: '酉' },
  { name: '寒露', zhi: '戌' },
  { name: '立冬', zhi: '亥' },
  { name: '大雪', zhi: '子' }
];

/**
 * 获取公历日期对应的月支（节气月）
 * 复用 bazi 模块的逻辑
 */
export function getMonthZhi(year: number, month: number, day: number): string {
  const targetTime = new Date(year, month - 1, day).getTime();

  let lastMatch = '丑'; // 默认丑月
  let lastTime = -Infinity;

  for (let y = year - 1; y <= year; y++) {
    for (const item of JIEQI_MONTH_ZHI) {
      const t = getJieQiTime(y, item.name as any);
      if (t !== undefined && t <= targetTime && t > lastTime) {
        lastTime = t;
        lastMatch = item.zhi;
      }
    }
  }

  return lastMatch;
}

/**
 * 判断当天是否是节气交接日（节，不是气）
 * 节气表中的"节"：立春、惊蛰、清明、立夏、芒种、小暑、立秋、白露、寒露、立冬、大雪、小寒
 * "气"：雨水、春分、谷雨、小满、夏至、大暑、处暑、秋分、霜降、小雪、冬至
 *
 * 注：使用对象字面量 + `in` 检查而非 `Set`，以确保 tsc 编译后仍可在所有 JS 环境运行
 */
const JIE_NAMES: Record<string, true> = {
  立春: true, 惊蛰: true, 清明: true, 立夏: true, 芒种: true, 小暑: true,
  立秋: true, 白露: true, 寒露: true, 立冬: true, 大雪: true, 小寒: true,
};

/**
 * 判断给定日期是否在某个节气交接日的当天
 * 交接日当天的建除值与前一日相同
 */
function isJieDay(year: number, month: number, day: number): boolean {
  for (const item of JIEQI_MONTH_ZHI) {
    // JIEQI_MONTH_ZHI 中的全部都是"节"，无需额外过滤
    if (!(item.name in JIE_NAMES)) continue;
    const t = getJieQiTime(year, item.name as any);
    if (t === undefined) continue;
    const jieDate = new Date(t);
    if (jieDate.getFullYear() === year &&
        jieDate.getMonth() + 1 === month &&
        jieDate.getDate() === day) {
      return true;
    }
  }
  return false;
}

/**
 * 计算单日的建除十二神
 *
 * @param year 公历年
 * @param month 公历月（1-12）
 * @param day 公历日
 * @returns 建除值
 */
export function getJianChu(year: number, month: number, day: number): JianChu {
  // 1. 如果是节气交接日（节），返回前一日的建除值
  if (isJieDay(year, month, day)) {
    const prev = new Date(year, month - 1, day - 1);
    return getJianChu(prev.getFullYear(), prev.getMonth() + 1, prev.getDate());
  }

  // 2. 获取月支和日支
  const monthZhi = getMonthZhi(year, month, day);
  const dayPillar = getDayPillar(year, month, day);

  // 3. 计算"日支与月支的地支差"
  // 差为 0 时是建日，差为 1 时是除日，依此类推
  const monthZhiIdx = getZhiIndex(monthZhi);
  const dayZhiIdx = getZhiIndex(dayPillar.zhi);
  const diff = (dayZhiIdx - monthZhiIdx + 12) % 12;

  return JIAN_CHU[diff];
}

/**
 * 获取建除值对应的黄道/黑道
 */
export function getDaoType(jianChu: JianChu): DaoType {
  return JIAN_CHU_DAO[jianChu];
}

/**
 * 获取建除值的吉凶等级
 */
export function getJianChuLevel(jianChu: JianChu): JianChuLevel {
  return JIAN_CHU_INFO[jianChu].level;
}

/**
 * 获取建除值的详细说明
 */
export function getJianChuInfo(jianChu: JianChu) {
  return JIAN_CHU_INFO[jianChu];
}

/**
 * 获取某日的"通用每日宜忌"（用于首页/运势页/推送）
 *
 * 数据来源：当日的建除十二神（不是按事项）
 * - 与择日页保持单一数据源 → 避免首页"宜出行"与择日页"出行不在宜列"的矛盾
 *
 * @param year 公历年
 * @param month 公历月（1-12）
 * @param day 公历日
 * @returns { yi: string[], ji: string[], jianChu, level, daoType, desc }
 */
export function getDailyYiJi(year: number, month: number, day: number): {
  yi: string[];
  ji: string[];
  jianChu: JianChu;
  level: JianChuLevel;
  daoType: DaoType;
  desc: string;
} {
  const ev = evaluateDay(year, month, day);
  return {
    yi: ev.yi,
    ji: ev.ji,
    jianChu: ev.jianChu,
    level: ev.level,
    daoType: ev.daoType,
    desc: ev.desc,
  };
}

/**
 * 单日建除评估结果
 */
export interface DayJianChu {
  /** 建除值 */
  jianChu: JianChu;
  /** 黄道/黑道 */
  daoType: DaoType;
  /** 吉凶等级 */
  level: JianChuLevel;
  /** 日干支 */
  dayGanZhi: string;
  /** 月支（节气月） */
  monthZhi: string;
  /** 宜 */
  yi: string[];
  /** 忌 */
  ji: string[];
  /** 说明 */
  desc: string;
}

/**
 * 完整评估某一日的建除信息
 */
export function evaluateDay(year: number, month: number, day: number): DayJianChu {
  const jianChu = getJianChu(year, month, day);
  const info = JIAN_CHU_INFO[jianChu];
  const dayPillar = getDayPillar(year, month, day);
  const monthZhi = getMonthZhi(year, month, day);

  return {
    jianChu,
    daoType: JIAN_CHU_DAO[jianChu],
    level: info.level,
    dayGanZhi: `${dayPillar.gan}${dayPillar.zhi}`,
    monthZhi,
    yi: info.yi,
    ji: info.ji,
    desc: info.desc,
  };
}

/**
 * 将公历日期格式化为 YYYY-MM-DD
 */
export function formatDate(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * 列出 DI_ZHI（供测试用）
 */
export const ALL_DI_ZHI = DI_ZHI;
