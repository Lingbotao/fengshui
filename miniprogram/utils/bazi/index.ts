/**
 * 八字排盘 · 统一入口
 *
 * 使用示例：
 * ```ts
 * import { paiPan } from './utils/bazi';
 *
 * const result = paiPan(1990, 5, 20, 14, 'male');
 * console.log(result.pillars); // 四柱
 * console.log(result.wuXing);  // 五行分布
 * console.log(result.daYun);   // 大运
 * ```
 */

import { calculateFourPillars, FourPillars } from './pillars';
import { calculatePillarShiShen, PillarShiShen, getShiShenByGan, getShiShenByZhi } from './shishen';
import { calculateWuXing, WuXingDistribution } from './wuxing';
import { calculateDaYun, DaYunResult, getLiuNian } from './dayun';

/** 完整八字排盘结果 */
export interface BaziResult {
  /** 输入的公历时间 */
  solarDate: {
    year: number;
    month: number;
    day: number;
    hour: number;
  };
  /** 四柱 */
  pillars: FourPillars;
  /** 四柱十神标注 */
  pillarShiShen: {
    year: PillarShiShen;
    month: PillarShiShen;
    day: PillarShiShen;
    hour: PillarShiShen;
  };
  /** 五行分布 */
  wuXing: WuXingDistribution;
  /** 大运 */
  daYun: DaYunResult;
  /** 命主信息 */
  summary: {
    /** 日主（命主） */
    dayMaster: string;
    /** 日主五行 */
    dayMasterWuXing: string;
    /** 生肖 */
    zodiac: string;
    /** 性别 */
    gender: 'male' | 'female';
  };
}

/**
 * 八字排盘主函数
 *
 * @param year 公历年
 * @param month 公历月（1-12）
 * @param day 公历日（1-31）
 * @param hour 公历时（0-23）
 * @param gender 性别
 * @returns 完整八字排盘结果
 */
export function paiPan(
  year: number,
  month: number,
  day: number,
  hour: number,
  gender: 'male' | 'female'
): BaziResult {
  // 1. 计算四柱
  const pillars = calculateFourPillars(year, month, day, hour);

  // 2. 计算十神
  const dayGan = pillars.day.gan;
  const pillarShiShen = {
    year: calculatePillarShiShen(dayGan, pillars.year.gan, pillars.year.zhi),
    month: calculatePillarShiShen(dayGan, pillars.month.gan, pillars.month.zhi),
    day: calculatePillarShiShen(dayGan, pillars.day.gan, pillars.day.zhi),
    hour: calculatePillarShiShen(dayGan, pillars.hour.gan, pillars.hour.zhi)
  };

  // 3. 五行分布（包含藏干，更精确）
  const wuXing = calculateWuXing(pillars, true);

  // 4. 大运
  const daYun = calculateDaYun(pillars, gender);

  return {
    solarDate: { year, month, day, hour },
    pillars,
    pillarShiShen,
    wuXing,
    daYun,
    summary: {
      dayMaster: pillars.day.gan,
      dayMasterWuXing: getGanWuXingName(pillars.day.gan),
      zodiac: pillars.raw.yearZodiac,
      gender
    }
  };
}

/** 获取天干五行名称 */
function getGanWuXingName(gan: string): string {
  const wxMap: Record<string, string> = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
  };
  return wxMap[gan] || '';
}

// ============== 单独导出子模块 ==============

// 常量
export {
  TIAN_GAN,
  DI_ZHI,
  WU_XING,
  GAN_WUXING,
  ZHI_WUXING,
  ZHI_CANGAN,
  WUXING_COLOR,
  JIE_QI_NAMES
} from './constants';

export type { WuXing } from './constants';

// 四柱
export {
  calculateFourPillars,
  getYearPillar,
  getMonthPillar,
  getDayPillar,
  getHourPillar
} from './pillars';

export type { FourPillars } from './pillars';

// 十神
export {
  getShiShenByGan,
  getShiShenByZhi,
  calculatePillarShiShen
} from './shishen';

export type { PillarShiShen, ShiShen } from './shishen';

// 五行
export { calculateWuXing, getWuXingColor } from './wuxing';
export type { WuXingDistribution } from './wuxing';

// 大运流年
export { calculateDaYun, getDaYunDirection, getLiuNian } from './dayun';
export type { DaYun, DaYunResult } from './dayun';

// 节气查表
export { getJieQiTime, hasJieQiTable, getJieQiTimes } from './jieqiTable';
export type { } from './jieqiTable';