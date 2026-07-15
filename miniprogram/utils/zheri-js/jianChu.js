"use strict";
/**
 * 择日工具 · 建除十二神算法
 * tsc 编译自 jianChu.ts（module: commonjs）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = exports.evaluateDay = exports.getJianChuInfo = exports.getJianChuLevel = exports.getDaoType = exports.getJianChu = exports.getMonthZhi = void 0;
const constants_1 = require("./constants");
const pillars_1 = require("../bazi-js/pillars");
const constants_2 = require("../bazi-js/constants");
const jieqiTable_1 = require("../bazi-js/jieqiTable");
const JIEQI_MONTH_ZHI = [
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
const JIE_NAMES = {
  '立春': true, '惊蛰': true, '清明': true, '立夏': true, '芒种': true, '小暑': true,
  '立秋': true, '白露': true, '寒露': true, '立冬': true, '大雪': true, '小寒': true
};
function getMonthZhi(year, month, day) {
  const targetTime = new Date(year, month - 1, day).getTime();
  let lastMatch = '丑';
  let lastTime = -Infinity;
  for (let y = year - 1; y <= year; y++) {
    for (let i = 0; i < JIEQI_MONTH_ZHI.length; i++) {
      const item = JIEQI_MONTH_ZHI[i];
      const t = jieqiTable_1.getJieQiTime(y, item.name);
      if (t !== undefined && t <= targetTime && t > lastTime) {
        lastTime = t;
        lastMatch = item.zhi;
      }
    }
  }
  return lastMatch;
}
exports.getMonthZhi = getMonthZhi;
function isJieDay(year, month, day) {
  for (const item of JIEQI_MONTH_ZHI) {
    if (!(item.name in JIE_NAMES)) continue;
    const t = jieqiTable_1.getJieQiTime(year, item.name);
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
function getJianChu(year, month, day) {
  if (isJieDay(year, month, day)) {
    const prev = new Date(year, month - 1, day - 1);
    return getJianChu(prev.getFullYear(), prev.getMonth() + 1, prev.getDate());
  }
  const monthZhi = getMonthZhi(year, month, day);
  const dayPillar = pillars_1.getDayPillar(year, month, day);
  const monthZhiIdx = constants_2.getZhiIndex(monthZhi);
  const dayZhiIdx = constants_2.getZhiIndex(dayPillar.zhi);
  const diff = (dayZhiIdx - monthZhiIdx + 12) % 12;
  return constants_1.JIAN_CHU[diff];
}
exports.getJianChu = getJianChu;
function getDaoType(jianChu) {
  return constants_1.JIAN_CHU_DAO[jianChu];
}
exports.getDaoType = getDaoType;
function getJianChuLevel(jianChu) {
  return constants_1.JIAN_CHU_INFO[jianChu].level;
}
exports.getJianChuLevel = getJianChuLevel;
function getJianChuInfo(jianChu) {
  return constants_1.JIAN_CHU_INFO[jianChu];
}
exports.getJianChuInfo = getJianChuInfo;
function evaluateDay(year, month, day) {
  const jianChu = getJianChu(year, month, day);
  const info = constants_1.JIAN_CHU_INFO[jianChu];
  const dayPillar = pillars_1.getDayPillar(year, month, day);
  const monthZhi = getMonthZhi(year, month, day);
  return {
    jianChu,
    daoType: constants_1.JIAN_CHU_DAO[jianChu],
    level: info.level,
    dayGanZhi: `${dayPillar.gan}${dayPillar.zhi}`,
    monthZhi,
    yi: info.yi,
    ji: info.ji,
    desc: info.desc,
  };
}
exports.evaluateDay = evaluateDay;
/**
 * 获取某日的"通用每日宜忌"（用于首页/运势页/推送）
 * 与择日页共享同一份 JIAN_CHU_INFO，避免首页"宜出行"与择日页矛盾
 */
function getDailyYiJi(year, month, day) {
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
exports.getDailyYiJi = getDailyYiJi;
function formatDate(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}
exports.formatDate = formatDate;
