/**
 * saveBaziRecord - 保存八字排盘记录
 * 云函数
 *
 * 用途：用户每次排盘后保存到云端，便于历史回顾
 */
const cloud = require('wx-server-sdk');

cloud.init();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const db = cloud.database();

  const {
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    gender,
    label,        // 可选：用户自定义标签（如"自己"、"妈妈"）
    pillars,      // 四柱：{ year, month, day, hour }
    pillarShiShen,// 十神
    wuXing,       // 五行分布
    daYun,        // 大运
    summary,      // 摘要
  } = event;

  try {
    // 1. 验证必填参数
    if (typeof birthYear !== 'number' || typeof birthMonth !== 'number'
        || typeof birthDay !== 'number' || typeof birthHour !== 'number') {
      return { success: false, error: '生辰参数不完整' };
    }
    if (!['男', '女'].includes(gender)) {
      return { success: false, error: '无效的性别' };
    }

    // 2. 检查数量限制（每个用户最多 50 条）
    const { total } = await db.collection('bazi_records')
      .where({ _openid: openid })
      .count();

    if (total >= 50) {
      // 删除最早的记录
      const { data: oldestList } = await db.collection('bazi_records')
        .where({ _openid: openid })
        .orderBy('createdAt', 'asc')
        .limit(1)
        .get();

      if (oldestList && oldestList.length > 0) {
        await db.collection('bazi_records').doc(oldestList[0]._id).remove();
      }
    }

    // 3. 保存记录
    const now = new Date();
    const data = {
      _openid: openid,
      birthYear,
      birthMonth,
      birthDay,
      birthHour,
      gender,
      label: label || '自己',
      pillars,
      pillarShiShen,
      wuXing,
      daYun,
      summary,
      createdAt: now,
      updatedAt: now,
    };

    const res = await db.collection('bazi_records').add({ data });

    return {
      success: true,
      data: { _id: res._id, createdAt: now },
    };
  } catch (err) {
    console.error('saveBaziRecord error:', err);
    return {
      success: false,
      error: err.message,
    };
  }
};