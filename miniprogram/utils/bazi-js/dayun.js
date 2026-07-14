"use strict";
/**
 * 八字排盘 · 大运 + 流年
 *
 * 大运算法：
 * 1. 阳男阴女：顺排（从月柱往后推）
 * 2. 阴男阳女：逆排（从月柱往前推）
 * 3. 起运岁数：出生日到下一个节气的天数 / 3 = 起运岁数
 * 4. 每 10 年换一步大运
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaYunDirection = getDaYunDirection;
exports.calculateDaYun = calculateDaYun;
exports.getLiuNian = getLiuNian;
exports.getLiuNianGan = getLiuNianGan;
exports.getLiuNianZhi = getLiuNianZhi;
const constants_1 = require("./constants");
/**
 * 判断大运排盘方向
 *
 * 阳年男/阴年女 → 顺排
 * 阴年男/阳年女 → 逆排
 */
function getDaYunDirection(yearGan, gender) {
    const yang = constants_1.GAN_YIN_YANG[yearGan] === 0; // 0=阳
    if (yang && gender === 'male')
        return '顺排';
    if (!yang && gender === 'female')
        return '顺排';
    return '逆排';
}
/**
 * 计算大运
 *
 * @param pillars 四柱
 * @param gender 性别
 * @param steps 大运步数（默认 8 步 = 80 年）
 */
function calculateDaYun(pillars, gender, steps = 8) {
    const direction = getDaYunDirection(pillars.year.gan, gender);
    const monthGanIdx = (0, constants_1.getGanIndex)(pillars.month.gan);
    const monthZhiIdx = (0, constants_1.getZhiIndex)(pillars.month.zhi);
    const daYunList = [];
    const step = 10; // 每步大运 10 年
    for (let i = 0; i < steps; i++) {
        let ganIdx;
        let zhiIdx;
        if (direction === '顺排') {
            ganIdx = (monthGanIdx + i + 1) % 10;
            zhiIdx = (monthZhiIdx + i + 1) % 12;
        }
        else {
            ganIdx = (monthGanIdx - i - 1 + 10 * 10) % 10;
            zhiIdx = (monthZhiIdx - i - 1 + 12 * 10) % 12;
        }
        daYunList.push({
            step: i + 1,
            startAge: 1 + i * step, // 简化为 1 岁起运
            startYear: 0, // 需要结合出生年份
            ganZhi: constants_1.TIAN_GAN[ganIdx] + constants_1.DI_ZHI[zhiIdx],
            gan: constants_1.TIAN_GAN[ganIdx],
            zhi: constants_1.DI_ZHI[zhiIdx]
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
function getLiuNian(year) {
    const ganIdx = (year - 4) % 10;
    const zhiIdx = (year - 4) % 12;
    return constants_1.TIAN_GAN[ganIdx] + constants_1.DI_ZHI[zhiIdx];
}
/**
 * 获取指定年份的流年天干地支
 */
function getLiuNianGan(year) {
    const ganIdx = (year - 4) % 10;
    return constants_1.TIAN_GAN[ganIdx];
}
function getLiuNianZhi(year) {
    const zhiIdx = (year - 4) % 12;
    return constants_1.DI_ZHI[zhiIdx];
}
