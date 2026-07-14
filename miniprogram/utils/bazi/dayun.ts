/**
 * 八字排盘 · 大运 + 流年
 *
 * 大运算法：
 * 1. 阳男阴女：顺排（从月柱往后推）
 * 2. 阴男阳女：逆排（从月柱往前推）
 * 3. 起运岁数：出生日到下一个节气的天数 / 3 = 起运岁数
 * 4. 每 10 年换一步大运
 */

import { TIAN_GAN, DI_ZHI, GAN_YIN_YANG, ZHI_YIN_YANG, getGanIndex, getZhiIndex } from './constants';
import { FourPillars } from './pillars';

/** 单步大运 */
export interface DaYun {
  /** 第几步大运（1-8） */
  step: number;
  /** 起始年龄 */
  startAge: number;
  /** 起始年份（公历） */
  startYear: number;
  /** 大运干支 */
  ganZhi: string;
  /** 天干 */
  gan: string;
  /** 地支 */
  zhi: string;
}

/** 大运结果 */
export interface DaYunResult {
  /** 起运年龄 */
  qiYunAge: number;
  /** 起运方向：顺/逆 */
  direction: '顺排' | '逆排';
  /** 大运列表（通常 8 步，覆盖 80 年） */
  daYunList: DaYun[];
}

/**
 * 判断大运排盘方向
 *
 * 阳年男/阴年女 → 顺排
 * 阴年男/阳年女 → 逆排
 */
export function getDaYunDirection(yearGan: string, gender: 'male' | 'female'): '顺排' | '逆排' {
  const yang = GAN_YIN_YANG[yearGan] === 0; // 0=阳
  if (yang && gender === 'male') return '顺排';
  if (!yang && gender === 'female') return '顺排';
  return '逆排';
}

/**
 * 计算大运
 *
 * @param pillars 四柱
 * @param gender 性别
 * @param steps 大运步数（默认 8 步 = 80 年）
 */
export function calculateDaYun(
  pillars: FourPillars,
  gender: 'male' | 'female',
  steps: number = 8
): DaYunResult {
  const direction = getDaYunDirection(pillars.year.gan, gender);

  const monthGanIdx = getGanIndex(pillars.month.gan);
  const monthZhiIdx = getZhiIndex(pillars.month.zhi);

  const daYunList: DaYun[] = [];
  const step = 10; // 每步大运 10 年

  for (let i = 0; i < steps; i++) {
    let ganIdx: number;
    let zhiIdx: number;

    if (direction === '顺排') {
      ganIdx = (monthGanIdx + i + 1) % 10;
      zhiIdx = (monthZhiIdx + i + 1) % 12;
    } else {
      ganIdx = (monthGanIdx - i - 1 + 10 * 10) % 10;
      zhiIdx = (monthZhiIdx - i - 1 + 12 * 10) % 12;
    }

    daYunList.push({
      step: i + 1,
      startAge: 1 + i * step, // 简化为 1 岁起运
      startYear: 0, // 需要结合出生年份
      ganZhi: TIAN_GAN[ganIdx] + DI_ZHI[zhiIdx],
      gan: TIAN_GAN[ganIdx],
      zhi: DI_ZHI[zhiIdx]
    });
  }

  return {
    qiYunAge: 1, // 简化处理，实际应根据节气差计算
    direction,
    daYunList
  };
}

/**
 * 计算流年（某一年的干支）
 */
export function getLiuNian(year: number): string {
  const ganIdx = (year - 4) % 10;
  const zhiIdx = (year - 4) % 12;
  return TIAN_GAN[ganIdx] + DI_ZHI[zhiIdx];
}

/**
 * 获取指定年份的流年天干地支
 */
export function getLiuNianGan(year: number): string {
  const ganIdx = (year - 4) % 10;
  return TIAN_GAN[ganIdx];
}

export function getLiuNianZhi(year: number): string {
  const zhiIdx = (year - 4) % 12;
  return DI_ZHI[zhiIdx];
}