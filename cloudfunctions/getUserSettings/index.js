/**
 * getUserSettings - 获取用户设置
 * 云函数
 */
const cloud = require('wx-server-sdk');

cloud.init();

// 云函数入口
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const db = cloud.database();

  try {
    // 查询用户设置
    const { data: userSettings } = await db.collection('user_settings')
      .where({ _openid: openid })
      .get();

    if (userSettings && userSettings.length > 0) {
      return {
        success: true,
        data: userSettings[0],
      };
    }

    // 无设置，返回默认值
    return {
      success: true,
      data: {
        zodiac: '鼠',
        gender: '男',
        birthYear: 1995,
        birthMonth: 1,
        birthDay: 1,
      },
    };
  } catch (err) {
    console.error('getUserSettings error:', err);
    return {
      success: false,
      error: err.message,
    };
  }
};