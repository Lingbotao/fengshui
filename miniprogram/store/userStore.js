/**
 * 吉星宝典 · MobX Store
 * 用户设置 + 共享状态管理
 */
const { makeAutoObservable } = require('mobx-miniprogram');

class UserStore {
  // 用户设置
  zodiac = '鼠' // 生肖（自动计算）
  gender = '男' // 性别
  birthYear = 1995 // 出生年份
  birthMonth = 1 // 出生月份
  birthDay = 1 // 出生日期

  // 今日黄历数据
  dailyAlmanac = null

  // 五行穿衣数据
  wuxingClothes = []

  // 运势数据
  fortuneData = null

  // 加载状态
  isLoading = false

  // 构造函数
  constructor() {
    makeAutoObservable(this);
    this.initFromStorage();
  }

  // 计算生肖
  calculateZodiac(birthYear) {
    const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    const offset = 2024 - birthYear;
    const idx = ((offset % 12) + 12) % 12;
    return zodiacs[idx];
  }

  // 从本地存储初始化
  initFromStorage() {
    const userSettings = wx.getStorageSync('user_settings');
    if (userSettings) {
      const birthYear = userSettings.birthYear || 1995;
      this.zodiac = this.calculateZodiac(birthYear);
      this.gender = userSettings.gender || '男';
      this.birthYear = birthYear;
      this.birthMonth = userSettings.birthMonth || 1;
      this.birthDay = userSettings.birthDay || 1;
    }
  }

  // 更新用户设置（生肖自动从年份计算）
  updateUserSettings(settings) {
    if (settings.gender) this.gender = settings.gender;
    if (settings.birthYear) {
      this.birthYear = settings.birthYear;
      this.zodiac = this.calculateZodiac(settings.birthYear);
    }
    if (settings.birthMonth) this.birthMonth = settings.birthMonth;
    if (settings.birthDay) this.birthDay = settings.birthDay;
    // 同步到本地存储
    wx.setStorageSync('user_settings', {
      zodiac: this.zodiac,
      gender: this.gender,
      birthYear: this.birthYear,
      birthMonth: this.birthMonth,
      birthDay: this.birthDay,
    });
  }

  // 设置性别
  setGender(gender) {
    this.gender = gender;
  }

  // 设置出生日期
  setBirthDate(year, month, day) {
    this.birthYear = year;
    this.birthMonth = month;
    this.birthDay = day;
    this.zodiac = this.calculateZodiac(year);
  }

  // 更新今日黄历
  setDailyAlmanac(data) {
    this.dailyAlmanac = data;
  }

  // 更新五行穿衣
  setWuxingClothes(data) {
    this.wuxingClothes = data;
  }

  // 更新运势数据
  setFortuneData(data) {
    this.fortuneData = data;
  }

  // 设置加载状态
  setLoading(loading) {
    this.isLoading = loading;
  }

  // 保存设置到云端
  async saveToCloud() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'saveUserSettings',
        data: {
          zodiac: this.zodiac,
          gender: this.gender,
          birthYear: this.birthYear,
          birthMonth: this.birthMonth,
          birthDay: this.birthDay,
        },
      });
      return res;
    } catch (err) {
      console.error('保存用户设置失败', err);
      throw err;
    }
  }

  // 从云端加载设置
  async loadFromCloud() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getUserSettings',
      });
      if (res.result && res.result.data) {
        this.updateUserSettings(res.result.data);
      }
    } catch (err) {
      console.error('加载用户设置失败', err);
    }
  }
}

// 导出 store 实例
const store = new UserStore();

module.exports = {
  store,
  UserStore,
};