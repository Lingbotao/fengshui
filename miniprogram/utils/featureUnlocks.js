/**
 * 全局功能解锁配置
 *
 * 设计要点：
 * 1. 用绝对日期（转时间戳）控制功能解锁，无需依赖"首次使用日期"
 *
 * 使用示例：
 * ```js
 * const { isFeatureUnlocked, FEATURE_UNLOCKS } = require('../../utils/featureUnlocks.js');
 *
 * // 检查八字是否解锁
 * if (isFeatureUnlocked('bazi')) {
 *   this.setData({ showBaziEntry: true });
 * }
 *
 * // 在某页面 onLoad 拦截
 * if (!isFeatureUnlocked('bazi')) {
 *   wx.switchTab({ url: '/pages/index/index' });
 * }
 * ```
 */

/**
 * 功能解锁时间配置（Unix 时间戳，单位毫秒）
 */

/**
 * 解析本地日期字符串为时间戳
 * 用法：`localTimestamp('2026-07-16')` = 当天 00:00:00 本地时间戳
 */
function localTimestamp(dateStr) {
  // 'YYYY-MM-DD' 解析为本地 0 点
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

const FEATURE_UNLOCKS = {
  // 底部 Tab「势头」按钮：2026-07-09 本地 00:00 解锁
  // 锁定时 Tab 完全隐藏，解锁后「势头」Tab + 八字排盘入口同时可用
  fortuneTab: localTimestamp('2026-07-06'),

  // 择日工具：默认已开放（与 P1 计划对齐）
  // 锁定可通过设为未来日期启用
  zheri: 0,

  // 示例：分享卡片
  // shareCard: localTimestamp('2026-07-20'),
};

/**
 * 判断功能是否解锁
 * @param {string} featureKey 功能键名
 * @returns {boolean}
 */
function isFeatureUnlocked(featureKey) {
  const unlockTs = FEATURE_UNLOCKS[featureKey];
  // 配置中没有的功能视为已解锁（向后兼容）
  if (unlockTs === undefined || unlockTs === null) return true;
  // 0 或负数视为已解锁（开发调试用）
  if (unlockTs <= 0) return true;
  return Date.now() >= unlockTs;
}

/**
 * 获取距离解锁的剩余毫秒数（用于倒计时）
 * @param {string} featureKey
 * @returns {number} 负数表示已解锁
 */
function msUntilUnlock(featureKey) {
  const unlockTs = FEATURE_UNLOCKS[featureKey];
  if (unlockTs === undefined || unlockTs === null) return -1;
  if (unlockTs <= 0) return -1;
  return unlockTs - Date.now();
}

/**
 * 获取解锁日期字符串（方便日志/调试）
 * @param {string} featureKey
 * @returns {string|null}
 */
function getUnlockDateStr(featureKey) {
  const unlockTs = FEATURE_UNLOCKS[featureKey];
  if (!unlockTs || unlockTs <= 0) return null;
  const d = new Date(unlockTs);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 列出所有功能及其解锁状态
 */
function listAllFeatures() {
  return Object.keys(FEATURE_UNLOCKS).map(key => ({
    key,
    unlockTs: FEATURE_UNLOCKS[key],
    unlockDate: getUnlockDateStr(key),
    unlocked: isFeatureUnlocked(key),
    msLeft: msUntilUnlock(key),
  }));
}

module.exports = {
  FEATURE_UNLOCKS,
  isFeatureUnlocked,
  msUntilUnlock,
  getUnlockDateStr,
  listAllFeatures,
  localTimestamp,
};