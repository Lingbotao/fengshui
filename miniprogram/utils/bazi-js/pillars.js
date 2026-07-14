"use strict";
/**
 * 八字排盘 · 四柱计算
 *
 * 四柱：年柱、月柱、日柱、时柱
 *
 * 关键规则：
 * 1. 年柱：以「立春」为换年点（不是农历正月初一）
 * 2. 月柱：以 24 节气中的「节」（立春、惊蛰...）为换月点
 * 3. 日柱：从已知基准日（1900-01-31 甲戌日）开始累加
 * 4. 时柱：晚子时（23:00-00:59）单独处理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYearPillar = getYearPillar;
exports.getMonthPillar = getMonthPillar;
exports.getDayPillar = getDayPillar;
exports.getHourPillar = getHourPillar;
exports.calculateFourPillars = calculateFourPillars;
const constants_1 = require("./constants");
const jieqiTable_1 = require("./jieqiTable");
/**
 * 计算年柱
 *
 * 算法：以立春为换年点
 * 立春前：年柱 = 上一年
 * 立春后：年柱 = 当前年
 *
 * 年干计算公式：(年份 - 4) % 10（公元 4 年为甲子年起点）
 * 年支计算公式：(年份 - 4) % 12
 */
function getYearPillar(year, isBeforeLiChun) {
    const actualYear = isBeforeLiChun ? year - 1 : year;
    const ganIdx = (actualYear - 4) % 10;
    const zhiIdx = (actualYear - 4) % 12;
    return {
        gan: constants_1.TIAN_GAN[ganIdx],
        zhi: constants_1.DI_ZHI[zhiIdx]
    };
}
/**
 * 计算月柱
 *
 * 算法：以 24 节气中的「节」为换月点
 * 节气表（月份地支）：
 *   立春(2月)→寅月、惊蛰(3月)→卯月、清明(4月)→辰月...
 *
 * 月干计算公式：年干决定月干起始
 *   甲己之年丙作首（寅月起丙寅）
 *   乙庚之岁戊为头
 *   丙辛必定寻庚起
 *   丁壬壬位顺行流
 *   戊癸之年甲虎头
 */
function getMonthPillar(year, month, day, hour) {
    // 判断当前时间在哪个节气月
    const monthZhi = getMonthZhiByDate(year, month, day, hour);
    const monthZhiIdx = (0, constants_1.getZhiIndex)(monthZhi); // 寅=2, 卯=3...子=0, 丑=1
    // 获取年干（以立春为界）
    const isBeforeLiChun = isBeforeJieqi(year, month, day, hour, '立春');
    const yearGan = getYearPillar(year, isBeforeLiChun).gan;
    // 月干计算：寅月（2月）的月干由年干决定
    // 寅月索引 = 2，月干偏移 = (年干索引 % 5) * 2 + 2
    // 推导：甲己年→丙(2)、乙庚年→戊(4)、丙辛年→庚(6)、丁壬年→壬(8)、戊癸年→甲(0)
    // 即 monthGanOffset = (yearGanIdx % 5) * 2
    const yearGanIdx = (0, constants_1.getGanIndex)(yearGan);
    const monthGanOffset = (yearGanIdx % 5) * 2;
    // 寅月(地支索引2)对应月干起始
    const baseGanIdx = (2 + monthGanOffset) % 10;
    // 当前月地支索引与寅月的差值
    const diff = (monthZhiIdx - 2 + 12) % 12;
    const monthGanIdx = (baseGanIdx + diff) % 10;
    return {
        gan: constants_1.TIAN_GAN[monthGanIdx],
        zhi: monthZhi,
        monthZhi
    };
}
/**
 * 判断当前日期是否在某个节气之前
 */
function isBeforeJieqi(year, month, day, hour, jieqiName) {
    const jieqiTime = (0, jieqiTable_1.getJieQiTime)(year, jieqiName);
    if (!jieqiTime) {
        // 没有数据，fallback 简化判断
        return false;
    }
    const targetTime = new Date(year, month - 1, day, hour).getTime();
    return targetTime < jieqiTime;
}
/**
 * 根据当前日期获取月份地支（节气表法）
 *
 * 节气月地支对照：
 *   立春(2月)→寅、惊蛰(3月)→卯、清明(4月)→辰...
 *   大雪(12月)→子、小寒(1月)→丑
 *
 * 算法：在 24 节气表中找到「当前时间之前的最后一个节气」对应的月份地支
 */
function getMonthZhiByDate(year, month, day, hour) {
    // 24 节气 → 月地支映射（按时间顺序从小寒开始）
    const jieqiMonthZhi = [
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
    const targetTime = new Date(year, month - 1, day, hour).getTime();
    // 在当前年和上一年中查找最近的节气
    let lastMatch = '丑'; // 默认丑月
    let lastTime = -Infinity;
    for (let y = year - 1; y <= year; y++) {
        for (const item of jieqiMonthZhi) {
            const t = (0, jieqiTable_1.getJieQiTime)(y, item.name);
            if (t !== undefined && t <= targetTime && t > lastTime) {
                lastTime = t;
                lastMatch = item.zhi;
            }
        }
    }
    return lastMatch;
}
/**
 * 计算日柱
 *
 * 算法：基准日累加法
 * 已知 1900-01-01 是甲戌日（天干索引 0，地支索引 10）
 * 日柱 = (目标日 - 基准日) % 60 → 60甲子循环
 */
const BASE_DATE = new Date('1900-01-01T00:00:00+08:00').getTime();
const BASE_DAY_GAN_IDX = 0; // 甲
const BASE_DAY_ZHI_IDX = 10; // 戌
function getDayPillar(year, month, day) {
    const targetDate = new Date(year, month - 1, day).getTime();
    const diffDays = Math.floor((targetDate - BASE_DATE) / (24 * 60 * 60 * 1000));
    // 60甲子循环
    const offset = ((diffDays % 60) + 60) % 60;
    const ganIdx = (BASE_DAY_GAN_IDX + offset) % 10;
    const zhiIdx = (BASE_DAY_ZHI_IDX + offset) % 12;
    return {
        gan: constants_1.TIAN_GAN[ganIdx],
        zhi: constants_1.DI_ZHI[zhiIdx]
    };
}
/**
 * 计算时柱
 *
 * 算法：
 * 1. 根据小时获取时支（子时 23:00-00:59 需特殊处理）
 * 2. 时干 = (日干 * 2 + 时支索引) % 10
 *    甲己日子时起甲子
 *    乙庚日子时起丙子
 *    丙辛日子时起戊子
 *    丁壬日子时起庚子
 *    戊癸日子时起壬子
 */
function getHourPillar(dayGan, hour) {
    // 23:00 - 23:59 是晚子时，需要用下一天日干计算（这里简化标记，由调用方处理）
    const isLateZi = hour === 23;
    const adjustedHour = hour === 23 ? 0 : hour;
    // 根据小时获取时支
    const hourZhi = getHourZhi(adjustedHour);
    // 时干计算：日干决定子时天干
    const dayGanIdx = (0, constants_1.getGanIndex)(dayGan);
    const hourZhiIdx = (0, constants_1.getZhiIndex)(hourZhi);
    // 子时天干 = (日干索引 % 5) * 2
    const baseGanIdx = (dayGanIdx % 5) * 2;
    // 当前时支与子时的差
    const diff = (hourZhiIdx - 0 + 12) % 12;
    const hourGanIdx = (baseGanIdx + diff) % 10;
    return {
        gan: constants_1.TIAN_GAN[hourGanIdx],
        zhi: hourZhi,
        isLateZi
    };
}
/**
 * 根据小时获取时支
 */
function getHourZhi(hour) {
    if (hour === 23 || hour === 0)
        return '子';
    if (hour === 1 || hour === 2)
        return '丑';
    if (hour === 3 || hour === 4)
        return '寅';
    if (hour === 5 || hour === 6)
        return '卯';
    if (hour === 7 || hour === 8)
        return '辰';
    if (hour === 9 || hour === 10)
        return '巳';
    if (hour === 11 || hour === 12)
        return '午';
    if (hour === 13 || hour === 14)
        return '未';
    if (hour === 15 || hour === 16)
        return '申';
    if (hour === 17 || hour === 18)
        return '酉';
    if (hour === 19 || hour === 20)
        return '戌';
    if (hour === 21 || hour === 22)
        return '亥';
    return '子';
}
/**
 * 综合计算四柱（主入口）
 *
 * @param year 公历年
 * @param month 公历月（1-12）
 * @param day 公历日（1-31）
 * @param hour 公历时（0-23）
 */
function calculateFourPillars(year, month, day, hour) {
    // 判断是否在立春前
    const isBeforeLiChun = isBeforeJieqi(year, month, day, hour, '立春');
    // 年柱
    const yearPillar = getYearPillar(year, isBeforeLiChun);
    // 月柱（以节气月地支决定）
    const monthPillar = getMonthPillar(year, month, day, hour);
    // 晚子时处理（子平派规则：23:00-00:59 按第二天日干算时柱）
    // 但日柱还是按当天（紫微派/子平派在日柱上需保持一致）
    // 此处保持原行为：日柱 = 当天，时柱根据流派选择
    const isLateZi = hour === 23;
    const dayPillar = getDayPillar(year, month, day);
    // 时柱：晚子时（23:00）按次日的日干计算
    let effectiveDay = day;
    let effectiveMonth = month;
    let effectiveYear = year;
    if (isLateZi) {
        // 取下一天日期
        const tomorrow = new Date(year, month - 1, day + 1);
        effectiveYear = tomorrow.getFullYear();
        effectiveMonth = tomorrow.getMonth() + 1;
        effectiveDay = tomorrow.getDate();
    }
    const effectiveDayPillar = isLateZi ? getDayPillar(effectiveYear, effectiveMonth, effectiveDay) : dayPillar;
    const hourPillar = getHourPillar(effectiveDayPillar.gan, hour);
    // 生肖（由年支决定）
    const zodiacMap = {
        '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
        '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
        '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
    };
    const yearZodiac = zodiacMap[yearPillar.zhi] || '鼠';
    return {
        year: yearPillar,
        month: monthPillar,
        day: dayPillar,
        hour: hourPillar,
        raw: {
            yearZodiac,
            solarDate: new Date(year, month - 1, day, hour),
            isLateZiHour: hourPillar.isLateZi,
            isBeforeLiChun
        }
    };
}
