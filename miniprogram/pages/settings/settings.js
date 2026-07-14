// pages/settings/settings.js
const { store } = require('../../store/userStore');

Page({
  data: {
    statusBarHeight: 20,
    showBackBtn: false,

    // 用户设置（生肖自动计算）
    zodiac: '鼠',
    zodiacEmoji: '🐭',
    gender: '男',

    // 出生日期
    birthYear: 1995,
    birthMonth: 1,
    birthDay: 1,
    yearList: [],
    monthList: [1,2,3,4,5,6,7,8,9,10,11,12],
    dayList: [],

    // 下拉显示状态
    showGenderPopup: false,
    showDatePopup: false,
  },

  onLoad: function (options) {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
    });

    // 初始化年份列表（1925-2015）
    const years = [];
    for (let i = 2015; i >= 1925; i--) {
      years.push(i);
    }
    this.setData({ yearList: years });

    // 初始化日期列表
    this.updateDayList(1995, 1);

    // 检查是否有锚定参数
    if (options.anchor === 'zodiac') {
      this.setData({ showBackBtn: true });
    }

    // 从 Store 加载当前设置
    this.loadFromStore();
  },

  onShow: function () {
    // 自定义 tabBar：设置当前选中
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setSelected('/pages/settings/settings');
      this.getTabBar().refreshLockStatus && this.getTabBar().refreshLockStatus();
    }
    this.loadFromStore();
  },

  // 计算生肖
  calculateZodiac: function (birthYear) {
    const zodiacs = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
    // 简化计算：2024年是鼠年（甲子）
    const offset = 2024 - birthYear;
    const idx = ((offset % 12) + 12) % 12;
    return zodiacs[idx];
  },

  // 计算生肖Emoji
  calculateZodiacEmoji: function (zodiac) {
    const map = {
      '鼠': '🐭', '牛': '🐮', '虎': '🐯', '兔': '🐰',
      '龙': '🐲', '蛇': '🐍', '马': '🐴', '羊': '🐑',
      '猴': '🐵', '鸡': '🐔', '狗': '🐶', '猪': '🐷',
    };
    return map[zodiac] || '🐭';
  },

  // 从 Store 加载设置
  loadFromStore: function () {
    const birthYear = store.birthYear || 1995;
    const birthMonth = store.birthMonth || 1;
    const birthDay = store.birthDay || 1;

    // 自动计算生肖
    const zodiac = this.calculateZodiac(birthYear);

    this.setData({
      zodiac: zodiac,
      zodiacEmoji: this.calculateZodiacEmoji(zodiac),
      gender: store.gender || '男',
      birthYear: birthYear,
      birthMonth: birthMonth,
      birthDay: birthDay,
    });

    // 更新日期列表
    this.updateDayList(birthYear, birthMonth);
  },

  // 更新日期列表（根据年月计算天数）
  updateDayList: function (year, month) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    this.setData({ dayList: days });

    // 如果选择的日超过当月天数，调整
    if (this.data.birthDay > daysInMonth) {
      this.setData({ birthDay: daysInMonth });
    }
  },

  // 切换性别下拉
  toggleGenderPicker: function () {
    this.setData({
      showGenderPopup: !this.data.showGenderPopup,
      showDatePopup: false,
    });
  },

  // 选择性别
  selectGender: function (e) {
    const gender = e.currentTarget.dataset.gender;
    this.setData({
      gender: gender,
      showGenderPopup: false,
    });
  },

  // 切换日期选择
  toggleDatePicker: function () {
    this.setData({
      showDatePopup: !this.data.showDatePopup,
      showGenderPopup: false,
    });
  },

  // 选择年份（自动计算生肖）
  selectYear: function (e) {
    const year = e.currentTarget.dataset.year;
    const zodiac = this.calculateZodiac(year);
    this.setData({
      birthYear: year,
      zodiac: zodiac,
      zodiacEmoji: this.calculateZodiacEmoji(zodiac),
    });
    this.updateDayList(year, this.data.birthMonth);
    // 不关闭弹窗，继续选择
  },

  // 选择月份
  selectMonth: function (e) {
    const month = e.currentTarget.dataset.month;
    this.setData({ birthMonth: month });
    this.updateDayList(this.data.birthYear, month);
    // 不关闭弹窗，继续选择
  },

  // 选择日期
  selectDay: function (e) {
    const day = e.currentTarget.dataset.day;
    this.setData({ birthDay: day });
    // 不关闭弹窗，继续选择
  },

  // 保存设置
  saveSettings: function () {
    // 关闭所有下拉列表
    this.setData({
      showGenderPopup: false,
      showDatePopup: false,
    });

    const settings = {
      zodiac: this.data.zodiac,
      gender: this.data.gender,
      birthYear: this.data.birthYear,
      birthMonth: this.data.birthMonth,
      birthDay: this.data.birthDay,
    };

    // 更新 Store
    store.updateUserSettings(settings);

    // 提示
    wx.showToast({
      title: '设置已保存',
      icon: 'success',
      duration: 1500,
    });

    // 返回上一页
    setTimeout(() => {
      if (this.data.showBackBtn) {
        wx.navigateBack();
      } else {
        wx.switchTab({
          url: '/pages/fortune/fortune',
        });
      }
    }, 1500);
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack();
  },
});