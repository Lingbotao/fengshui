/**
 * 择日工具 · 统一导出入口
 *
 * 用法：
 * ```js
 * const { findGoodDays, evaluateDayForMatter, listMonthJianChu } = require('../../utils/zheri/index.js');
 *
 * // 婚嫁择日
 * const result = findGoodDays('婚嫁', 2026, 7, 1, 2026, 12, 31);
 * console.log(result.goodDays);
 * ```
 */

export {
  // 常量与类型
  JIAN_CHU,
  JIAN_CHU_INFO,
  JIAN_CHU_DAO,
  MATTER_TYPES,
  MATTER_PREFERRED,
  MATTER_FORBIDDEN,
  type JianChu,
  type JianChuLevel,
  type DaoType,
  type MatterType,
  type DayEvaluation,
  type ZhaiRiResult,
} from './constants';

// 建除算法
export {
  getJianChu,
  getDaoType,
  getJianChuLevel,
  getJianChuInfo,
  getMonthZhi,
  evaluateDay,
  getDailyYiJi,
  formatDate,
  type DayJianChu,
} from './jianChu';

// 择日匹配
export {
  findGoodDays,
  evaluateDayForMatter,
  listMonthJianChu,
} from './zheri';
