/**
 * getBaziRecords - 获取用户的八字排盘历史
 * 云函数
 */
const cloud = require('wx-server-sdk');

cloud.init();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const db = cloud.database();

  const { limit = 20, skip = 0 } = event;

  try {
    // 查询当前用户的八字记录
    const { data: records, total } = await db.collection('bazi_records')
      .where({ _openid: openid })
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(Math.min(limit, 50))
      .get();

    return {
      success: true,
      data: records,
      total,
    };
  } catch (err) {
    console.error('getBaziRecords error:', err);
    return {
      success: false,
      error: err.message,
    };
  }
};