"use strict";
/**
 * 八字排盘 · 常量定义
 * 包含天干地支、五行、十神等基础数据
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WUXING_COLOR = exports.MONTH_ZHI = exports.JIE_QI_NAMES = exports.HOUR_ZHI = exports.WUXING_KE = exports.WUXING_SHENG = exports.ZHI_YIN_YANG = exports.GAN_YIN_YANG = exports.ZHI_CANGAN = exports.ZHI_WUXING = exports.GAN_WUXING = exports.WU_XING = exports.DI_ZHI = exports.TIAN_GAN = void 0;
exports.getGanIndex = getGanIndex;
exports.getZhiIndex = getZhiIndex;
exports.getGanWuXing = getGanWuXing;
exports.getZhiWuXing = getZhiWuXing;
/** 天干 */
exports.TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
/** 地支 */
exports.DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
/** 五行 */
exports.WU_XING = ['金', '木', '水', '火', '土'];
/** 天干五行属性 */
exports.GAN_WUXING = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
};
/** 地支五行属性（本气） */
exports.ZHI_WUXING = {
    '子': '水', '亥': '水',
    '寅': '木', '卯': '木',
    '巳': '火', '午': '火',
    '申': '金', '酉': '金',
    '辰': '土', '戌': '土', '丑': '土', '未': '土'
};
/** 地支藏干（本气、中气、余气） */
exports.ZHI_CANGAN = {
    '子': ['癸'],
    '丑': ['己', '癸', '辛'],
    '寅': ['甲', '丙', '戊'],
    '卯': ['乙'],
    '辰': ['戊', '乙', '癸'],
    '巳': ['丙', '戊', '庚'],
    '午': ['丁', '己'],
    '未': ['己', '丁', '乙'],
    '申': ['庚', '壬', '戊'],
    '酉': ['辛'],
    '戌': ['戊', '辛', '丁'],
    '亥': ['壬', '甲']
};
/** 天干阴阳（阳=0, 阴=1） */
exports.GAN_YIN_YANG = {
    '甲': 0, '丙': 0, '戊': 0, '庚': 0, '壬': 0, // 阳
    '乙': 1, '丁': 1, '己': 1, '辛': 1, '癸': 1 // 阴
};
/** 地支阴阳 */
exports.ZHI_YIN_YANG = {
    '子': 0, '寅': 0, '辰': 0, '午': 0, '申': 0, '戌': 0, // 阳
    '丑': 1, '卯': 1, '巳': 1, '未': 1, '酉': 1, '亥': 1 // 阴
};
/** 五行相生：木→火→土→金→水→木 */
exports.WUXING_SHENG = {
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
};
/** 五行相克：木→土→水→火→金→木 */
exports.WUXING_KE = {
    '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
};
/** 时辰对应地支（23:00-01:00 为子时） */
exports.HOUR_ZHI = {
    0: '子', 1: '丑', 3: '寅', 5: '卯', 7: '辰', 9: '巳',
    11: '午', 13: '未', 15: '申', 17: '酉', 19: '戌', 21: '亥'
};
/** 24节气名称 */
exports.JIE_QI_NAMES = [
    '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
    '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
    '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
    '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
];
/** 月份地支（农历正月为寅月开始） */
exports.MONTH_ZHI = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
/** 十天干五行颜色映射（用于可视化） */
exports.WUXING_COLOR = {
    '木': '#5B7B6A', // 绿色
    '火': '#9C5A5A', // 红色
    '土': '#E8D5C4', // 黄色
    '金': '#C4B5A0', // 金色
    '水': '#3D4A5C' // 蓝色
};
/** 获取天干索引 */
function getGanIndex(gan) {
    return exports.TIAN_GAN.indexOf(gan);
}
/** 获取地支索引 */
function getZhiIndex(zhi) {
    return exports.DI_ZHI.indexOf(zhi);
}
/** 根据天干获取五行 */
function getGanWuXing(gan) {
    return exports.GAN_WUXING[gan];
}
/** 根据地支获取五行（本气） */
function getZhiWuXing(zhi) {
    return exports.ZHI_WUXING[zhi];
}
