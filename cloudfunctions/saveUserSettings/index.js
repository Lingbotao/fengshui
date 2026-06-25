/**
 * saveUserSettings - 保存用户设置
 * 云函数
 */
const cloud = require('wx-server-sdk');

cloud.init();

// 十二生肖
const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];

// 云函数入口
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const db = cloud.database();

  const {
    zodiac = '鼠',
    gender = '男',
    birthYear = 1995,
    birthMonth = 1,
    birthDay = 1,
  } = event;

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

    if (typeof birthYear !== 'number' || birthYear < 1925 || birthYear > 2015) {
      return {
        success: false,
        error: '无效的出生年份',
      };
    }

    if (typeof birthMonth !== 'number' || birthMonth < 1 || birthMonth > 12) {
      return {
        success: false,
        error: '无效的出生月份',
      };
    }

    if (typeof birthDay !== 'number' || birthDay < 1 || birthDay > 31) {
      return {
        success: false,
        error: '无效的出生日期',
      };
    }

    // 查询是否已存在
    const { data: existing } = await db.collection('user_settings')
      .where({ _openid: openid })
      .get();

    const now = new Date();
    const data = {
      zodiac,
      gender,
      birthYear,
      birthMonth,
      birthDay,
      updatedAt: now,
    };

    if (existing && existing.length > 0) {
      // 更新
      await db.collection('user_settings')
        .where({ _openid: openid })
        .update({
          data: data,
        });
    } else {
      // 新增
      data._openid = openid;
      data.createdAt = now;
      await db.collection('user_settings').add({
        data: data,
      });
    }

    return {
      success: true,
      message: '设置已保存',
    };
  } catch (err) {
    console.error('saveUserSettings error:', err);
    return {
      success: false,
      error: err.message,
    };
  }
};