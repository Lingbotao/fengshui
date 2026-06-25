// pages/index/index.js
const { createStoreBindings } = require('mobx-miniprogram-bindings');
const { store } = require('../../store/userStore');

Page({
  data: {
    // 状态栏高度
    statusBarHeight: 20,
    // 日期头
    lunarDate: '六月十二',
    ganzhiYear: '乙巳年',
    gregorianDate: '23',
    weekDay: '星期一',
    // 宜忌
    yiList: [],
    jiList: [],
    chongshaZodiac: '',
    chongshaDirection: '',
    // 吉神方位
    caishenDirection: '正南',
    xishenDirection: '东南',
    guishenDirection: '西北',
    // 五行穿衣
    wuxingClothes: [],
    // 加载状态
    isLoading: true,
  },

  onLoad: function () {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
    });
  },

  onReady: function () {
    // 加载今日黄历数据
    this.loadDailyAlmanac();
  },

  onShow: function () {
    // 每次显示时刷新数据
    this.loadDailyAlmanac();
  },

  onPullDownRefresh: function () {
    // 下拉刷新
    this.loadDailyAlmanac().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载今日黄历数据
  loadDailyAlmanac: async function () {
    this.setData({ isLoading: true });

    try {
      const dateStr = this.formatDate(new Date());

      const res = await wx.cloud.callFunction({
        name: 'getDailyAlmanac',
        data: {
          date: dateStr,
        },
      });


      if (res.result && res.result.data) {
        const data = res.result.data;
        this.setData({
          lunarDate: data.lunar,
          ganzhiYear: data.ganzhi?.year,
          gregorianDate: data.day,
          weekDay: data.weekDay,
          yiList: data.yi || [],
          jiList: data.ji || [],
          chongshaZodiac: data.chongsha?.zodiac || '',
          chongshaDirection: data.chongsha?.direction || '',
          caishenDirection: data.jiShenFangWei?.caishen || '正南',
          xishenDirection: data.jiShenFangWei?.xishen || '东南',
          guishenDirection: data.jiShenFangWei?.guishen || '西北',
          wuxingClothes: data.wuXingClothes || [],
          isLoading: false,
        });

        // 保存到 Store
        store.setDailyAlmanac(data);
        store.setWuxingClothes(data.wuXingClothes || []);
      } else {
        // 数据为空，使用模拟数据
        this.setMockData();
      }
    } catch (err) {
      console.error('[Index] 加载黄历数据失败:', err);
      this.setMockData();
    }
  },

  // 设置模拟数据（开发调试用）
  setMockData: function () {
    this.setData({
      lunarDate: '六月十二',
      ganzhiYear: '乙巳年',
      gregorianDate: '23',
      weekDay: '星期一',
      yiList: ['祭祀', '祈福', '开光', '订盟', '纳采'],
      jiList: ['动土', '破土', '安葬', '针灸', '伐木'],
      chongshaZodiac: '🐰 冲煞生肖：兔',
      chongshaDirection: '煞东',
      caishenDirection: '正南',
      xishenDirection: '东南',
      guishenDirection: '西北',
      wuxingClothes: [
        { name: '墨绿色', color: '#5B7B6A', description: '属木·助旺今日气场', recommended: true },
        { name: '暖杏色', color: '#E8D5C4', description: '属土·辅佐运势', recommended: false },
      ],
      isLoading: false,
    });
  },

  // 格式化日期
  formatDate: function (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
});