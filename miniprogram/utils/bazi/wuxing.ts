/**
 * 八字排盘 · 五行分布统计
 *
 * 统计四柱八字的五行分布：
 * - 天干五行（4 个）
 * - 地支本气五行（4 个）
 * - 地支藏干五行（可选，最多 12 个）
 *
 * 判定强弱：
 * - count >= 3：旺
 * - count == 2：相
 * - count == 1：休
 * - count == 0：囚/死
 */

import {
  WU_XING,
  ZHI_CANGAN,
  GAN_WUXING,
  ZHI_WUXING,
  WuXing
} from './constants';
import { FourPillars } from './pillars';

/** 五行分布结果 */
export interface WuXingDistribution {
  /** 五行数量统计（金木水火土） */
  count: Record<WuXing, number>;
  /** 各五行的强弱判定 */
  strength: Record<WuXing, '旺' | '相' | '休' | '囚' | '死'>;
  /** 缺失的五行 */
  missing: WuXing[];
  /** 最旺的五行 */
  strongest: WuXing | null;
  /** 最弱的五行 */
  weakest: WuXing | null;
  /** 统计范围说明 */
  source: 'gan_zhi' | 'full';  // gan_zhi=仅天干+地支本气 / full=包含藏干
}

/**
 * 计算五行分布
 *
 * @param pillars 四柱
 * @param includeCangan 是否包含地支藏干（默认 false，只算天干+地支本气）
 */
export function calculateWuXing(
  pillars: FourPillars,
  includeCangan: boolean = false
): WuXingDistribution {
  const count: Record<WuXing, number> = {
    '金': 0, '木': 0, '水': 0, '火': 0, '土': 0
  };

  // 天干五行
  [pillars.year, pillars.month, pillars.day, pillars.hour].forEach(pillar => {
    const ganWx = GAN_WUXING[pillar.gan];
    count[ganWx]++;
  });

  // 地支五行（本气）
  [pillars.year, pillars.month, pillars.day, pillars.hour].forEach(pillar => {
    const zhiWx = ZHI_WUXING[pillar.zhi];
    count[zhiWx]++;
  });

  // 地支藏干五行（可选）
  if (includeCangan) {
    [pillars.year, pillars.month, pillars.day, pillars.hour].forEach(pillar => {
      const cangans = ZHI_CANGAN[pillar.zhi] || [];
      cangans.forEach(gan => {
        const canganWx = GAN_WUXING[gan];
        count[canganWx]++;
      });
    });
  }

  // 判定强弱（基于 count）
  const strength: Record<WuXing, '旺' | '相' | '休' | '囚' | '死'> = {
    '金': '死', '木': '死', '水': '死', '火': '死', '土': '死'
  };

  WU_XING.forEach(wx => {
    const c = count[wx];
    if (c >= 3) strength[wx] = '旺';
    else if (c === 2) strength[wx] = '相';
    else if (c === 1) strength[wx] = '休';
    else strength[wx] = '囚';
  });

  // 缺失的五行
  const missing = WU_XING.filter(wx => count[wx] === 0);

  // 最旺 / 最弱
  let strongest: WuXing | null = null;
  let weakest: WuXing | null = null;
  let maxCount = -1;
  let minCount = Infinity;

  WU_XING.forEach(wx => {
    if (count[wx] > maxCount) {
      maxCount = count[wx];
      strongest = wx;
    }
    if (count[wx] < minCount) {
      minCount = count[wx];
      weakest = wx;
    }
  });

  return {
    count,
    strength,
    missing,
    strongest,
    weakest,
    source: includeCangan ? 'full' : 'gan_zhi'
  };
}

/**
 * 获取五行的颜色（用于 UI 可视化）
 */
export function getWuXingColor(wx: WuXing): string {
  const colors: Record<WuXing, string> = {
    '金': '#C4B5A0',
    '木': '#5B7B6A',
    '水': '#3D4A5C',
    '火': '#9C5A5A',
    '土': '#E8D5C4'
  };
  return colors[wx];
}