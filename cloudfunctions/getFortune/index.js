/**
 * getFortune - 获取运势数据
 * 云函数
 */
const cloud = require('wx-server-sdk');
const dayjs = require('dayjs');

cloud.init();

// 十二生肖
const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 运势模板（实际需自研算法）
const fortuneTemplates = {
  事业: [
    '今日贵人方位东南，利沟通表达，适合谈判签约。',
    '事业运势平稳，注意与同事沟通方式。',
    '工作进展顺利，但需注意细节把控。',
    '有新的发展机会，建议把握。',
    '适合团队协作，可获更多支持。',
  ],
  感情: [
    '桃花运平稳，已有伴侣者注意沟通细节。',
    '爱情运平稳，单身者有机会遇到有缘人。',
    '今日异性缘不错，可积极社交。',
    '注意处理感情中的小矛盾。',
    '适合表达感情的一天。',
  ],
  健康: [
    '注意颈椎疲劳，适当活动肩颈。',
    '健康运势良好，保持作息规律。',
    '注意休息，避免过度劳累。',
    '适合运动锻炼。',
    '注意饮食规律。',
  ],
  财运: [
    '正财稳定，偏财谨慎。',
    '财运平稳，适合稳健投资。',
    '有意外之财的可能。',
    '注意守财，避免冲动消费。',
    '理财运势良好。',
  ],
  总体: [
    '今日运势平稳上升，保持平常心即可。',
    '整体运势不错，适合开展新计划。',
    '运势平稳，需耐心等待机会。',
    '今日宜静不宜动。',
    '运势上吉，好事连连。',
  ],
};

/**
 * 根据生肖和性别获取运势
 */
function getFortuneByZodiac(zodiac, gender, date) {
  const zodiacIdx = zodiacs.indexOf(zodiac);
  const dayOfYear = date.date(); // 用日期作为索引

  // 基于生肖、性别、日期的随机种子
  const seed = (zodiacIdx * 100 + dayOfYear + (gender === '男' ? 1 : 2)) % 100;

  // 各维度运势
  const career = fortuneTemplates.事业[seed % fortuneTemplates.事业.length];
  const love = fortuneTemplates.感情[(seed + 1) % fortuneTemplates.感情.length];
  const health = fortuneTemplates.健康[(seed + 2) % fortuneTemplates.健康.length];
  const wealth = fortuneTemplates.财运[(seed + 3) % fortuneTemplates.财运.length];
  const overall = fortuneTemplates.总体[(seed + 4) % fortuneTemplates.总体.length];

  return [
    { dimension: '事业', content: career },
    { dimension: '感情', content: love },
    { dimension: '健康', content: health },
    { dimension: '财运', content: wealth },
    { dimension: '总体', content: overall },
  ];
}

// 云函数入口
exports.main = async (event, context) => {
  const { zodiac = '鼠', gender = '男' } = event;

  try {
    // 验证参数
    if (!zodiacs.includes(zodiac)) {
      return {
        success: false,
        error: '无效的生肖',
      };
    }

    if (!['男', '女'].includes(gender)) {
      return {
        success: false,
        error: '无效的性别',
      };
    }

    const date = dayjs();
    const fortuneList = getFortuneByZodiac(zodiac, gender, date);

    return {
      success: true,
      data: fortuneList,
    };
  } catch (err) {
    console.error('getFortune error:', err);
    return {
      success: false,
      error: err.message,
    };
  }
};