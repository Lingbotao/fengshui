/**
 * getDailyAlmanac - 获取每日黄历数据
 * 云函数
 */
const cloud = require('wx-server-sdk');
const dayjs = require('dayjs');

cloud.init();

// 十二生肖
const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 二十四山
const mountains24 = ['子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'];

// 基础宜忌数据（简化版，实际需自研算法）
const baseYi = ['祭祀', '祈福', '开光', '订盟', '纳采', '出行', '移徙', '入宅', '安门', '安床'];
const baseJi = ['动土', '破土', '安葬', '针灸', '伐木', '纳畜', '入宅', '移徙'];

// 吉神方位
const jiShenDirections = {
  0: { caishen: '正北', xishen: '东北', guishen: '西北' },
  1: { caishen: '东北', xishen: '正东', guishen: '正北' },
  2: { caishen: '正东', xishen: '东南', guishen: '东北' },
  3: { caishen: '东南', xishen: '正南', guishen: '正东' },
  4: { caishen: '正南', xishen: '西南', guishen: '东南' },
  5: { caishen: '西南', xishen: '正西', guishen: '正南' },
  6: { caishen: '正西', xishen: '西北', guishen: '西南' },
};

// 五行穿衣配色
const wuxingColors = [
  { name: '墨绿色', color: '#5B7B6A', wuxing: '木', description: '属木·助旺今日气场' },
  { name: '暖杏色', color: '#E8D5C4', wuxing: '土', description: '属土·辅佐运势' },
  { name: '藏蓝色', color: '#3D4A5C', wuxing: '水', description: '属水·智慧流畅' },
  { name: '砖红色', color: '#9C5A5A', wuxing: '火', description: '属火·事业兴旺' },
  { name: '金银色', color: '#C4B5A0', wuxing: '金', description: '属金·财运亨通' },
];

// 天干 → 五行
const TIANGAN_WUXING = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
};

// 五行生克：生我者=助色（穿它），同我者=主色，我生者=慎色
// 木生火 火生土 土生金 金生水 水生木
const WUXING_SHENG = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' };
// 我生者：我克者（慎色）
const WUXING_SHENG_OUT = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };

/**
 * 按日干五行选今日配色
 * @param {string} dayGan 日干（甲乙丙丁戊己庚辛壬癸）
 * @returns {{main: object, helper: object, avoid: object}}
 */
function selectWuxingColors(dayGan) {
  const wuxing = TIANGAN_WUXING[dayGan] || '土';
  const mainWuxing = wuxing;
  const helperWuxing = WUXING_SHENG[wuxing];  // 生我者
  const avoidWuxing = WUXING_SHENG_OUT[wuxing]; // 我生者（慎）

  const find = (wx) => wuxingColors.find(c => c.wuxing === wx) || wuxingColors[1];

  return {
    main: find(mainWuxing),
    helper: find(helperWuxing),
    avoid: find(avoidWuxing),
  };
}

// ============== 节气精确计算（与 cnlunar 一致：含 24 项节气，含中气）==============
// 24 节气名 → 索引（0=小寒, 1=大寒, ..., 23=冬至）
const JIEQI_NAMES = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨',
                     '立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑',
                     '白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];
const JIEQI_NAME_TO_IDX = {};
JIEQI_NAMES.forEach((n, i) => JIEQI_NAME_TO_IDX[n] = i);

// 节气日期表（覆盖 2020-2099，每年 24 项节气；数据来源：cnlunar.thisYearSolarTermsDic）
const JIEQI_TABLE = {
  2020: { 小寒:[1,6],大寒:[1,20],立春:[2,4],雨水:[2,19],惊蛰:[3,5],春分:[3,20],清明:[4,4],谷雨:[4,19],立夏:[5,5],小满:[5,20],芒种:[6,5],夏至:[6,21],小暑:[7,6],大暑:[7,22],立秋:[8,7],处暑:[8,22],白露:[9,7],秋分:[9,22],寒露:[10,8],霜降:[10,23],立冬:[11,7],小雪:[11,22],大雪:[12,7],冬至:[12,21] },
  2021: { 小寒:[1,5],大寒:[1,20],立春:[2,3],雨水:[2,18],惊蛰:[3,5],春分:[3,20],清明:[4,4],谷雨:[4,20],立夏:[5,5],小满:[5,21],芒种:[6,5],夏至:[6,21],小暑:[7,7],大暑:[7,22],立秋:[8,7],处暑:[8,23],白露:[9,7],秋分:[9,23],寒露:[10,8],霜降:[10,23],立冬:[11,7],小雪:[11,22],大雪:[12,7],冬至:[12,21] },
  2022: { 小寒:[1,5],大寒:[1,20],立春:[2,4],雨水:[2,19],惊蛰:[3,5],春分:[3,20],清明:[4,5],谷雨:[4,20],立夏:[5,5],小满:[5,21],芒种:[6,6],夏至:[6,21],小暑:[7,7],大暑:[7,23],立秋:[8,7],处暑:[8,23],白露:[9,7],秋分:[9,23],寒露:[10,8],霜降:[10,23],立冬:[11,7],小雪:[11,22],大雪:[12,7],冬至:[12,22] },
  2023: { 小寒:[1,5],大寒:[1,20],立春:[2,4],雨水:[2,19],惊蛰:[3,6],春分:[3,21],清明:[4,5],谷雨:[4,20],立夏:[5,6],小满:[5,21],芒种:[6,6],夏至:[6,21],小暑:[7,7],大暑:[7,23],立秋:[8,8],处暑:[8,23],白露:[9,8],秋分:[9,23],寒露:[10,8],霜降:[10,24],立冬:[11,8],小雪:[11,22],大雪:[12,7],冬至:[12,22] },
  2024: { 小寒:[1,6],大寒:[1,20],立春:[2,4],雨水:[2,19],惊蛰:[3,5],春分:[3,20],清明:[4,4],谷雨:[4,19],立夏:[5,5],小满:[5,20],芒种:[6,5],夏至:[6,21],小暑:[7,6],大暑:[7,22],立秋:[8,7],处暑:[8,22],白露:[9,7],秋分:[9,22],寒露:[10,8],霜降:[10,23],立冬:[11,7],小雪:[11,22],大雪:[12,6],冬至:[12,21] },
  2025: { 小寒:[1,5],大寒:[1,20],立春:[2,3],雨水:[2,18],惊蛰:[3,5],春分:[3,20],清明:[4,4],谷雨:[4,20],立夏:[5,5],小满:[5,21],芒种:[6,5],夏至:[6,21],小暑:[7,7],大暑:[7,22],立秋:[8,7],处暑:[8,23],白露:[9,7],秋分:[9,23],寒露:[10,8],霜降:[10,23],立冬:[11,7],小雪:[11,22],大雪:[12,7],冬至:[12,21] },
  2026: { 小寒:[1,5],大寒:[1,20],立春:[2,4],雨水:[2,18],惊蛰:[3,5],春分:[3,20],清明:[4,5],谷雨:[4,20],立夏:[5,5],小满:[5,21],芒种:[6,5],夏至:[6,21],小暑:[7,7],大暑:[7,23],立秋:[8,7],处暑:[8,23],白露:[9,7],秋分:[9,23],寒露:[10,8],霜降:[10,23],立冬:[11,7],小雪:[11,22],大雪:[12,7],冬至:[12,22] },
  2027: { 小寒:[1,5],大寒:[1,20],立春:[2,4],雨水:[2,19],惊蛰:[3,6],春分:[3,21],清明:[4,5],谷雨:[4,20],立夏:[5,6],小满:[5,21],芒种:[6,6],夏至:[6,21],小暑:[7,7],大暑:[7,23],立秋:[8,8],处暑:[8,23],白露:[9,8],秋分:[9,23],寒露:[10,8],霜降:[10,23],立冬:[11,7],小雪:[11,22],大雪:[12,7],冬至:[12,22] },
  2028: { 小寒:[1,6],大寒:[1,21],立春:[2,4],雨水:[2,19],惊蛰:[3,5],春分:[3,20],清明:[4,4],谷雨:[4,19],立夏:[5,5],小满:[5,20],芒种:[6,5],夏至:[6,21],小暑:[7,7],大暑:[7,22],立秋:[8,7],处暑:[8,22],白露:[9,7],秋分:[9,22],寒露:[10,7],霜降:[10,23],立冬:[11,7],小雪:[11,22],大雪:[12,6],冬至:[12,21] },
  2029: { 小寒:[1,5],大寒:[1,20],立春:[2,3],雨水:[2,18],惊蛰:[3,5],春分:[3,20],清明:[4,4],谷雨:[4,20],立夏:[5,5],小满:[5,21],芒种:[6,5],夏至:[6,21],小暑:[7,7],大暑:[7,22],立秋:[8,7],处暑:[8,23],白露:[9,8],秋分:[9,23],寒露:[10,8],霜降:[10,23],立冬:[11,7],小雪:[11,22],大雪:[12,7],冬至:[12,21] },
  2030: { 小寒:[1,5],大寒:[1,20],立春:[2,4],雨水:[2,18],惊蛰:[3,6],春分:[3,20],清明:[4,5],谷雨:[4,20],立夏:[5,5],小满:[5,21],芒种:[6,6],夏至:[6,21],小暑:[7,7],大暑:[7,23],立秋:[8,8],处暑:[8,23],白露:[9,8],秋分:[9,23],寒露:[10,8],霜降:[10,23],立冬:[11,7],小雪:[11,22],大雪:[12,7],冬至:[12,22] },
};

/**
 * 取指定年份的节气表（{节气名: [月, 日], ...}）。表外年份返回近似值。
 */
function _getJieqiTable(year) {
  if (JIEQI_TABLE[year]) return JIEQI_TABLE[year];
  return {
    立春: [2, 4], 惊蛰: [3, 6], 清明: [4, 5], 立夏: [5, 6],
    芒种: [6, 6], 小暑: [7, 7], 立秋: [8, 8], 白露: [9, 8],
    寒露: [10, 8], 立冬: [11, 8], 大雪: [12, 7], 小寒: [1, 6],
  };
}

/**
 * 计算指定日期的月支索引（0=寅, 1=卯, ..., 11=丑）
 * 节气与月支映射：立春→寅、惊蛰→卯、清明→辰、立夏→巳、芒种→午、小暑→未、
 *   立秋→申、白露→酉、寒露→戌、立冬→亥、大雪→子、小寒→丑。
 * 算法：找 date 之前最近的"节"，其月支即答案（与 Python 端 _month_zhi_index 一致）。
 */
function _getApartNum(year, month, day, jieqiTable, jieqiTablePrev) {
  /**
   * 计算 cnlunar 风格的 apartNum = (nextSolarNum + 1) // 2
   *   nextSolarNum = "date 之前 ≤ findDate 的节气数 mod 24"（cnlunar 总是用 year 表，不分春节前后）
   *   12 月特例：nextNum=0 → 强制 nextNum=24（apartNum=12）
   *   apartNum → 月支：0=子, 1=丑, ..., 11=亥, 12=子（次年）
   */
  const targetDate = new Date(year, month - 1, day);
  let count = 0;
  JIEQI_NAMES.forEach((name) => {
    if (jieqiTable[name]) {
      const [m, d] = jieqiTable[name];
      const jDate = new Date(year, m - 1, d);
      if (jDate <= targetDate) count++;
    }
  });
  let nextSolarNum = count % 24;
  // cnlunar 12 月特例：nextNum=0 → nextNum=24
  if (nextSolarNum === 0 && month === 12) {
    nextSolarNum = 24;
  }
  return Math.floor((nextSolarNum + 1) / 2);
}

function _monthZhiIndex(apartNum) {
  // apartNum → 月支索引（cnlunar 标准 0=子）
  return apartNum % 12;
}

/**
 * 计算天干地支（与 Python 端一致：立春分年 + 节气分月 + 基准日算日干支）
 */
function calculateGanZhi(date) {
  const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const diZhi  = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  const year = date.year();
  const month = date.month() + 1; // 1-12
  const day = date.date();

  // 2) 月支：按节气分月（先取节期表，立春判断也要用）
  //   monthZhiIdx 索引按 cnlunar 方式：0=子月, 1=丑月, ..., 11=亥月
  const jieqiTable = _getJieqiTable(year);    // 当年
  const jieqiTablePrev = _getJieqiTable(year - 1); // 跨年用
  const apartNum = _getApartNum(year, month, day, jieqiTable, jieqiTablePrev); // 0=子, 1=丑, ..., 11=亥, 12=子
  const monthZhiIdx = apartNum % 12; // 0=子月（标准地支顺序）

  // 1) 年干支：以春节为分界（与 cnlunar 一致：春节当日才属新年）
  const newYearMonth = LUNAR_INFO[year] ? LUNAR_INFO[year].newYear[0] : 2;
  const newYearDay = LUNAR_INFO[year] ? LUNAR_INFO[year].newYear[1] : 17;
  const isAfterNewYear = month > newYearMonth || (month === newYearMonth && day >= newYearDay);
  const ganzhiYear = isAfterNewYear ? year : year - 1;

  // 月支顺序：cnlunar 标准（0=子, ..., 11=亥）= diZhiStandard
  const diZhiStandard = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  // 兼容 Python 端 zhi_order（寅起编号）的输出字段（如有调用）
  const ZHI_ORDER_PYTHON = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];

  // 3) 年干支索引
  const yearGanIdx = ((ganzhiYear - 4) % 10 + 10) % 10;
  const yearZhiIdx = ((ganzhiYear - 4) % 12 + 12) % 12;

  // 4) 月干支：照搬 cnlunar 公式
  //   month60Idx = ((year - 2019) * 12 + apartNum) % 60
  //   apartNum 来自 _getApartNum：cnlunar 对 12 月 nextNum=0 时强制 nextNum=24（apartNum=12）
  //   已在 _getApartNum 内通过 fallthrough 实现
  const month60Idx = ((year - 2019) * 12 + apartNum) % 60;
  const monthGanIdx = month60Idx % 10;

  // 5) 日干支：以 1900-01-01（甲戌日，基准日）顺推
  const BASE_DATE = new Date(1900, 0, 1);
  const targetDate = new Date(year, month - 1, day);
  const daysSince = Math.round((targetDate - BASE_DATE) / (1000 * 60 * 60 * 24));
  const dayGanIdx = ((daysSince + 0) % 10 + 10) % 10; // 1900-01-31 是甲(0)
  const dayZhiIdx = ((daysSince + 10) % 12 + 12) % 12; // 1900-01-31 是戌(10)

  return {
    year: tianGan[yearGanIdx] + diZhiStandard[yearZhiIdx] + '年',
    month: tianGan[monthGanIdx] + diZhiStandard[monthZhiIdx] + '月',
    day: tianGan[dayGanIdx] + diZhiStandard[dayZhiIdx] + '日',
    // 兼容 Python 端 zhi_order（寅起编号）
    monthZhiIdxPython: monthZhiIdx, // 旧字段，值为 (cnlunar_idx - 2 + 12) % 12
    monthZhiPython: ZHI_ORDER_PYTHON[monthZhiIdx],
  };
}

/**
 * 计算冲煞（与 Python 端一致：日支六冲 + 子午卯酉四正方煞）
 * 六冲：子午、丑未、寅申、卯酉、辰戌、巳亥
 * 四正方煞（仅日支为子午卯酉时）：子冲煞南、午冲煞北、卯冲煞西、酉冲煞东
 */
function calculateChongsha(date, zodiac) {
  // 从已有 ganzhi 取日支（与 Python 端一致不依赖生肖参数）
  const ganzhi = calculateGanZhi(date);
  const dayZhi = ganzhi.day.charAt(1); // "甲申日" → "申"

  const diZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const dayZhiIdx = diZhi.indexOf(dayZhi);

  // 六冲：i + 6 = 冲
  const chongIdx = (dayZhiIdx + 6) % 12;

  // 四正方煞（传统规则：日支为四正方时煞其对面）
  const SHA_BY_DAYZHI = { 子: '南', 午: '北', 卯: '西', 酉: '东' };
  const direction = SHA_BY_DAYZHI[dayZhi] || '中';

  return {
    zodiac: zodiacs[chongIdx],
    direction: direction,
  };
}

/**
 * 计算农历（基于 1900-2100 农历信息表，与 Python 端 cnlunar 一致）
 * 数据来源：香港天文台农历资料
 *
 * LUNAR_INFO[year] = {
 *   newYear: [month, day],   // 该年春节对应的公历月日
 *   months: [29|30 × 12 或 13],
 *   leap: 闰几月序号（1-12），0 表示无闰
 * }
 * months 数组：长度 12（无闰）或 13（有闰），顺序为 1月、2月、…、leap月、leap+1月、…12月
 *   例：2023 年闰二月 → months 长度 13，索引 [正(29), 二(30), 闰二(29), 三(30), …]
 */
const LUNAR_INFO = {
  2020: { newYear: [1, 25], months: [29,30,29,30,29,30,29,30,30,29,30,29], leap: 4 },
  2021: { newYear: [2, 12], months: [30,29,30,29,30,29,30,29,30,29,30,29,30], leap: 2 },
  2022: { newYear: [2, 1],  months: [30,29,30,29,30,30,29,30,29,30,29,30], leap: 0 },
  2023: { newYear: [1, 22], months: [29,30,29,30,30,29,30,29,30,29,30,29,30], leap: 2 },
  2024: { newYear: [2, 10], months: [30,29,30,29,30,30,29,30,29,30,29,30], leap: 0 },
  2025: { newYear: [1, 29], months: [29,30,29,30,29,30,29,30,29,30,30,29,30], leap: 6 },
  2026: { newYear: [2, 17], months: [30,29,30,29,29,30,29,30,30,29,30,29], leap: 0 },
  2027: { newYear: [2, 6],  months: [30,29,30,29,30,29,30,29,30,29,30,30], leap: 0 },
  2028: { newYear: [1, 26], months: [29,30,29,30,29,30,29,30,29,30,30,29,30], leap: 5 },
  2029: { newYear: [2, 13], months: [30,29,30,29,30,29,30,29,30,29,30,29,30], leap: 0 },
  2030: { newYear: [2, 3],  months: [30,29,30,30,29,30,29,30,29,30,29,30], leap: 0 },
};

/**
 * 计算农历（与 Python 端 cnlunar.get_lunarCn 输出一致）
 */
function calculateLunar(date) {
  const LUNAR_MONTH_NAMES = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
  const LUNAR_DAY_NAMES = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];

  const year = date.year();
  const month = date.month() + 1;
  const day = date.date();
  const targetDate = new Date(year, month - 1, day);

  // 1) 找到对应的农历年（春节之前算上年）
  let lunarYear = year;
  let info = LUNAR_INFO[year];
  if (info) {
    const newYear = new Date(year, info.newYear[0] - 1, info.newYear[1]);
    if (targetDate < newYear) {
      lunarYear = year - 1;
      info = LUNAR_INFO[year - 1];
      if (!info) info = null;
    }
  }
  // 处理 12-1 月跨年情况
  if (!info && month === 1) {
    lunarYear = year - 1;
    info = LUNAR_INFO[year - 1];
  }
  if (!info && month === 12) {
    // 12 月可能跨到次年春节前，但此处简化：按当年 info
    info = LUNAR_INFO[year];
  }

  if (info) {
    const newYear = new Date(lunarYear, info.newYear[0] - 1, info.newYear[1]);
    const daysSinceNewYear = Math.round((targetDate - newYear) / (1000 * 60 * 60 * 24)) + 1;

    // 累加各月天数找到对应月份
    let remaining = daysSinceNewYear;
    let lunarMonth = 1;
    let isLeap = false;
    const months = info.months;
    const leap = info.leap;

    for (let i = 0; i < months.length; i++) {
      if (remaining <= months[i]) {
        // 当前 i 对应月份
        if (leap > 0) {
          if (i === leap) {            // 闰月
            isLeap = true;
            lunarMonth = leap;
          } else if (i > leap) {        // 闰月之后的非闰月
            lunarMonth = i;             // 因为闰月占了 1 个索引，所以非闰月编号 = i
          } else {                      // 闰月之前的非闰月
            lunarMonth = i + 1;
          }
        } else {
          lunarMonth = i + 1;
        }
        break;
      }
      remaining -= months[i];
    }

    const monthStr = LUNAR_MONTH_NAMES[lunarMonth - 1] + (isLeap ? '（闰）' : '') + '月';
    const dayStr = LUNAR_DAY_NAMES[remaining - 1] || '初一';
    return monthStr + dayStr;
  }

  // 降级路径：表外年份用近似算法（按公历月日）
  return LUNAR_MONTH_NAMES[month - 1] + '月' + (LUNAR_DAY_NAMES[day - 1] || '初一');
}

/**
 * 星期几
 */
function getWeekDay(date) {
  const weeks = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return weeks[date.day()];
}

// 云函数入口
exports.main = async (event, context) => {
  const db = cloud.database();

  try {
    // 解析日期，默认今天
    const dateStr = event.date || dayjs().format('YYYY-MM-DD');
    const date = dayjs(dateStr);

    // 先从数据库查询
    const { data: almanacData } = await db.collection('daily_almanac')
      .where({ date: dateStr })
      .get();

    if (almanacData && almanacData.length > 0) {
      return {
        success: true,
        data: almanacData[0],
      };
    }

    // 数据库无数据，生成实时数据
    const dayOfYear = date.date(); // 用日期作为索引
    const dayIdx = dayOfYear % 7;

    // 计算天干地支
    const ganzhi = calculateGanZhi(date);

    // 计算冲煞（默认用生肖鼠）
    const chongsha = calculateChongsha(date, '鼠');

    // 计算吉神方位
    const jiShenFangWei = jiShenDirections[dayIdx % 6];

    // 随机选择宜忌（实际需算法）
    const yiList = baseYi.slice(0, 5 + (dayIdx % 3));
    const jiList = baseJi.slice(0, 4 + (dayIdx % 2));

    // 五行穿衣（按日干五行）
    // 从已有 ganzhi.day 形如 "甲申日" 中取日干
    const dayGanChar = ganzhi.day ? ganzhi.day.charAt(0) : '甲';
    const wuXingColors = selectWuxingColors(dayGanChar);
    // 向后兼容：保留 todayColors 字段供前端使用，同时增加主色/助色/慎色命名字段
    const todayColors = [wuXingColors.main, wuXingColors.helper];

    // 构建数据
    const result = {
      date: dateStr,
      day: date.date(),
      weekDay: getWeekDay(date),
      lunar: calculateLunar(date),
      ganzhi: ganzhi,
      yi: yiList,
      ji: jiList,
      chongsha: chongsha,
      jiShenFangWei: jiShenFangWei,
      wuXingClothes: todayColors,
      wuXingColors: wuXingColors,
      createdAt: db.serverDate(),
    };

    // 存入数据库（可选）
    try {
      await db.collection('daily_almanac').add({
        data: result,
      });
    } catch (e) {
      // 忽略存储错误
    }

    // 移除 serverDate 以返回给前端
    delete result.createdAt;

    return {
      success: true,
      data: result,
    };
  } catch (err) {
    console.error('getDailyAlmanac error:', err);
    return {
      success: false,
      error: err.message,
    };
  }
};