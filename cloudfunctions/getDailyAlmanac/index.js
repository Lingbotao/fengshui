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

/**
 * 计算天干地支
 */
function calculateGanZhi(date) {
  const year = date.year();
  const month = date.month() + 1;
  const day = date.date();

  // 天干（0=甲）
  const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  // 地支（0=子）
  const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 简化计算（实际需精确算法）
  const yearGanIdx = (year - 4) % 10;
  const monthGanIdx = (month + 1) % 10;
  const dayGanIdx = (day + 8) % 10;

  const yearZhiIdx = (year - 4) % 12;
  const monthZhiIdx = (month + 1) % 12;
  const dayZhiIdx = (day + 8) % 12;

  return {
    year: tianGan[yearGanIdx] + diZhi[yearZhiIdx] + '年',
    month: tianGan[monthGanIdx] + diZhi[monthZhiIdx] + '月',
    day: tianGan[dayGanIdx] + diZhi[dayZhiIdx] + '日',
  };
}

/**
 * 计算冲煞
 */
function calculateChongsha(date, zodiac) {
  const day = date.date();
  const zodiacIdx = zodiacs.indexOf(zodiac);
  const chongIdx = (day + zodiacIdx) % 12;

  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const dirIdx = day % 8;

  return {
    zodiac: zodiacs[chongIdx],
    direction: directions[dirIdx],
  };
}

/**
 * 计算农历（简化版）
 */
function calculateLunar(date) {
  const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

  const month = date.month();
  const day = date.date();

  return lunarMonths[month] + '月' + lunarDays[day - 1];
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

    // 五行穿衣（轮换）
    const colorIdx = dayOfYear % wuxingColors.length;
    const todayColors = [
      wuxingColors[colorIdx],
      wuxingColors[(colorIdx + 1) % wuxingColors.length],
    ];

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