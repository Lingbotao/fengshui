"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJieQiTimes = exports.hasJieQiTable = exports.getJieQiTime = exports.getLiuNian = exports.getDaYunDirection = exports.calculateDaYun = exports.getWuXingColor = exports.calculateWuXing = exports.calculatePillarShiShen = exports.getShiShenByZhi = exports.getShiShenByGan = exports.getHourPillar = exports.getDayPillar = exports.getMonthPillar = exports.getYearPillar = exports.calculateFourPillars = exports.JIE_QI_NAMES = exports.WUXING_COLOR = exports.ZHI_CANGAN = exports.ZHI_WUXING = exports.GAN_WUXING = exports.WU_XING = exports.DI_ZHI = exports.TIAN_GAN = void 0;
exports.paiPan = paiPan;
const pillars_1 = require("./pillars");
const shishen_1 = require("./shishen");
const wuxing_1 = require("./wuxing");
const dayun_1 = require("./dayun");
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
function paiPan(year, month, day, hour, gender) {
    // 1. 计算四柱
    const pillars = (0, pillars_1.calculateFourPillars)(year, month, day, hour);
    // 2. 计算十神
    const dayGan = pillars.day.gan;
    const pillarShiShen = {
        year: (0, shishen_1.calculatePillarShiShen)(dayGan, pillars.year.gan, pillars.year.zhi),
        month: (0, shishen_1.calculatePillarShiShen)(dayGan, pillars.month.gan, pillars.month.zhi),
        day: (0, shishen_1.calculatePillarShiShen)(dayGan, pillars.day.gan, pillars.day.zhi),
        hour: (0, shishen_1.calculatePillarShiShen)(dayGan, pillars.hour.gan, pillars.hour.zhi)
    };
    // 3. 五行分布（包含藏干，更精确）
    const wuXing = (0, wuxing_1.calculateWuXing)(pillars, true);
    // 4. 大运
    const daYun = (0, dayun_1.calculateDaYun)(pillars, gender);
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
function getGanWuXingName(gan) {
    const wxMap = {
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
var constants_1 = require("./constants");
Object.defineProperty(exports, "TIAN_GAN", { enumerable: true, get: function () { return constants_1.TIAN_GAN; } });
Object.defineProperty(exports, "DI_ZHI", { enumerable: true, get: function () { return constants_1.DI_ZHI; } });
Object.defineProperty(exports, "WU_XING", { enumerable: true, get: function () { return constants_1.WU_XING; } });
Object.defineProperty(exports, "GAN_WUXING", { enumerable: true, get: function () { return constants_1.GAN_WUXING; } });
Object.defineProperty(exports, "ZHI_WUXING", { enumerable: true, get: function () { return constants_1.ZHI_WUXING; } });
Object.defineProperty(exports, "ZHI_CANGAN", { enumerable: true, get: function () { return constants_1.ZHI_CANGAN; } });
Object.defineProperty(exports, "WUXING_COLOR", { enumerable: true, get: function () { return constants_1.WUXING_COLOR; } });
Object.defineProperty(exports, "JIE_QI_NAMES", { enumerable: true, get: function () { return constants_1.JIE_QI_NAMES; } });
// 四柱
var pillars_2 = require("./pillars");
Object.defineProperty(exports, "calculateFourPillars", { enumerable: true, get: function () { return pillars_2.calculateFourPillars; } });
Object.defineProperty(exports, "getYearPillar", { enumerable: true, get: function () { return pillars_2.getYearPillar; } });
Object.defineProperty(exports, "getMonthPillar", { enumerable: true, get: function () { return pillars_2.getMonthPillar; } });
Object.defineProperty(exports, "getDayPillar", { enumerable: true, get: function () { return pillars_2.getDayPillar; } });
Object.defineProperty(exports, "getHourPillar", { enumerable: true, get: function () { return pillars_2.getHourPillar; } });
// 十神
var shishen_2 = require("./shishen");
Object.defineProperty(exports, "getShiShenByGan", { enumerable: true, get: function () { return shishen_2.getShiShenByGan; } });
Object.defineProperty(exports, "getShiShenByZhi", { enumerable: true, get: function () { return shishen_2.getShiShenByZhi; } });
Object.defineProperty(exports, "calculatePillarShiShen", { enumerable: true, get: function () { return shishen_2.calculatePillarShiShen; } });
// 五行
var wuxing_2 = require("./wuxing");
Object.defineProperty(exports, "calculateWuXing", { enumerable: true, get: function () { return wuxing_2.calculateWuXing; } });
Object.defineProperty(exports, "getWuXingColor", { enumerable: true, get: function () { return wuxing_2.getWuXingColor; } });
// 大运流年
var dayun_2 = require("./dayun");
Object.defineProperty(exports, "calculateDaYun", { enumerable: true, get: function () { return dayun_2.calculateDaYun; } });
Object.defineProperty(exports, "getDaYunDirection", { enumerable: true, get: function () { return dayun_2.getDaYunDirection; } });
Object.defineProperty(exports, "getLiuNian", { enumerable: true, get: function () { return dayun_2.getLiuNian; } });
// 节气查表
var jieqiTable_1 = require("./jieqiTable");
Object.defineProperty(exports, "getJieQiTime", { enumerable: true, get: function () { return jieqiTable_1.getJieQiTime; } });
Object.defineProperty(exports, "hasJieQiTable", { enumerable: true, get: function () { return jieqiTable_1.hasJieQiTable; } });
Object.defineProperty(exports, "getJieQiTimes", { enumerable: true, get: function () { return jieqiTable_1.getJieQiTimes; } });
