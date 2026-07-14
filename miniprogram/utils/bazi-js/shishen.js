"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHI_SHEN = void 0;
exports.getShiShenByGan = getShiShenByGan;
exports.getShiShenByZhi = getShiShenByZhi;
exports.getZhiCangansShiShen = getZhiCangansShiShen;
exports.calculatePillarShiShen = calculatePillarShiShen;
exports.getZhiBenQiShiShen = getZhiBenQiShiShen;
const constants_1 = require("./constants");
/** 十神名称 */
exports.SHI_SHEN = [
    '比肩', '劫财', '食神', '伤官', '偏财',
    '正财', '七杀', '正官', '偏印', '正印'
];
/**
 * 根据天干计算十神
 *
 * @param dayGan 日干（命主，「我」）
 * @param otherGan 目标天干（用于判断十神）
 */
function getShiShenByGan(dayGan, otherGan) {
    const dayGanIdx = (0, constants_1.getGanIndex)(dayGan);
    const otherGanIdx = (0, constants_1.getGanIndex)(otherGan);
    // 同我（同行同五行）
    if (constants_1.GAN_WUXING[dayGan] === constants_1.GAN_WUXING[otherGan]) {
        return dayGanIdx % 2 === otherGanIdx % 2 ? '比肩' : '劫财';
    }
    const dayWx = constants_1.GAN_WUXING[dayGan];
    const otherWx = constants_1.GAN_WUXING[otherGan];
    // 我生（食神/伤官）
    if (constants_1.WUXING_SHENG[dayWx] === otherWx) {
        return dayGanIdx % 2 === otherGanIdx % 2 ? '食神' : '伤官';
    }
    // 我克（偏财/正财）
    if (constants_1.WUXING_KE[dayWx] === otherWx) {
        return dayGanIdx % 2 === otherGanIdx % 2 ? '偏财' : '正财';
    }
    // 克我（七杀/正官）
    if (constants_1.WUXING_KE[otherWx] === dayWx) {
        return dayGanIdx % 2 === otherGanIdx % 2 ? '七杀' : '正官';
    }
    // 生我（偏印/正印）
    if (constants_1.WUXING_SHENG[otherWx] === dayWx) {
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
function getShiShenByZhi(dayGan, zhi) {
    const cangans = constants_1.ZHI_CANGAN[zhi] || [];
    if (cangans.length === 0)
        return '比肩';
    // 取本气（第一个藏干）
    return getShiShenByGan(dayGan, cangans[0]);
}
/**
 * 地支藏干的十神详细列表
 */
function getZhiCangansShiShen(dayGan, zhi) {
    const cangans = constants_1.ZHI_CANGAN[zhi] || [];
    return cangans.map(gan => ({
        gan,
        shiShen: getShiShenByGan(dayGan, gan)
    }));
}
function calculatePillarShiShen(dayGan, gan, zhi) {
    return {
        ganShiShen: getShiShenByGan(dayGan, gan),
        zhiShiShen: getShiShenByZhi(dayGan, zhi),
        cangans: getZhiCangansShiShen(dayGan, zhi)
    };
}
/**
 * 地支十神（用于大运流年）
 */
function getZhiBenQiShiShen(dayGan, zhi) {
    return getShiShenByZhi(dayGan, zhi);
}
