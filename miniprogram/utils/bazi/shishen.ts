/**
 * 八字排盘 · 十神计算
 *
 * 十神定义（以日干为主，我）：
 * - 比肩：与我同阴阳、同五行（同我）
 * - 劫财：与我异阴阳、同五行（同我）
 * - 食神：我生异阴阳（我生）
 * - 伤官：我生同阴阳（我生）
 * - 偏财：我克异阴阳（我克）
 * - 正财：我克同阴阳（我克）
 * - 七杀：克我异阴阳（克我）
 * - 正官：克我同阴阳（克我）
 * - 偏印：生我异阴阳（生我）
 * - 正印：生我同阴阳（生我）
 */

import {
  TIAN_GAN,
  DI_ZHI,
  ZHI_CANGAN,
  GAN_WUXING,
  WUXING_SHENG,
  WUXING_KE,
  getGanIndex,
  WuXing
} from './constants';

/** 十神名称 */
export const SHI_SHEN = [
  '比肩', '劫财', '食神', '伤官', '偏财',
  '正财', '七杀', '正官', '偏印', '正印'
] as const;
export type ShiShen = typeof SHI_SHEN[number];

/**
 * 根据天干计算十神
 *
 * @param dayGan 日干（命主，「我」）
 * @param otherGan 目标天干（用于判断十神）
 */
export function getShiShenByGan(dayGan: string, otherGan: string): ShiShen {
  const dayGanIdx = getGanIndex(dayGan);
  const otherGanIdx = getGanIndex(otherGan);

  // 同我（同行同五行）
  if (GAN_WUXING[dayGan] === GAN_WUXING[otherGan]) {
    return dayGanIdx % 2 === otherGanIdx % 2 ? '比肩' : '劫财';
  }

  const dayWx = GAN_WUXING[dayGan];
  const otherWx = GAN_WUXING[otherGan];

  // 我生（食神/伤官）
  if (WUXING_SHENG[dayWx] === otherWx) {
    return dayGanIdx % 2 === otherGanIdx % 2 ? '食神' : '伤官';
  }

  // 我克（偏财/正财）
  if (WUXING_KE[dayWx] === otherWx) {
    return dayGanIdx % 2 === otherGanIdx % 2 ? '偏财' : '正财';
  }

  // 克我（七杀/正官）
  if (WUXING_KE[otherWx] === dayWx) {
    return dayGanIdx % 2 === otherGanIdx % 2 ? '七杀' : '正官';
  }

  // 生我（偏印/正印）
  if (WUXING_SHENG[otherWx] === dayWx) {
    return dayGanIdx % 2 === otherGanIdx % 2 ? '偏印' : '正印';
  }

  return '比肩'; // 兜底
}

/**
 * 根据地支藏干计算十神（取本气）
 *
 * @param dayGan 日干
 * @param zhi 地支
 */
export function getShiShenByZhi(dayGan: string, zhi: string): ShiShen {
  const cangans = ZHI_CANGAN[zhi] || [];
  if (cangans.length === 0) return '比肩';

  // 取本气（第一个藏干）
  return getShiShenByGan(dayGan, cangans[0]);
}

/**
 * 地支藏干的十神详细列表
 */
export function getZhiCangansShiShen(dayGan: string, zhi: string): Array<{ gan: string; shiShen: ShiShen }> {
  const cangans = ZHI_CANGAN[zhi] || [];
  return cangans.map(gan => ({
    gan,
    shiShen: getShiShenByGan(dayGan, gan)
  }));
}

/**
 * 计算四柱的十神标注
 *
 * 返回每个柱的天干十神、地支十神、藏干十神详情
 */
export interface PillarShiShen {
  ganShiShen: ShiShen;            // 天干十神
  zhiShiShen: ShiShen;            // 地支本气十神
  cangans: Array<{ gan: string; shiShen: ShiShen }>; // 藏干十神列表
}

export function calculatePillarShiShen(
  dayGan: string,
  gan: string,
  zhi: string
): PillarShiShen {
  return {
    ganShiShen: getShiShenByGan(dayGan, gan),
    zhiShiShen: getShiShenByZhi(dayGan, zhi),
    cangans: getZhiCangansShiShen(dayGan, zhi)
  };
}

/**
 * 地支十神（用于大运流年）
 */
export function getZhiBenQiShiShen(dayGan: string, zhi: string): ShiShen {
  return getShiShenByZhi(dayGan, zhi);
}