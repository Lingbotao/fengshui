/**
 * deleteBaziRecord - 删除八字排盘记录
 * 云函数
 */
const cloud = require('wx-server-sdk');

cloud.init();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const db = cloud.database();

  const { recordId } = event;

  try {
    if (!recordId) {
      return { success: false, error: 'recordId 不能为空' };
    }

    // 删除时校验 _openid（防止误删他人记录）
    const { data: record } = await db.collection('bazi_records')
      .doc(recordId)
      .get();

    if (!record || record._openid !== openid) {
      return { success: false, error: '记录不存在或无权删除' };
    }

    await db.collection('bazi_records').doc(recordId).remove();

    return { success: true };
  } catch (err) {
    console.error('deleteBaziRecord error:', err);
    return {
      success: false,
      error: err.message,
    };
  }
};