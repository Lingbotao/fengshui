// pages/index/index.js
const { createStoreBindings } = require('mobx-miniprogram-bindings');
const { store } = require('../../store/userStore');
const { isAuditSwitchOn, refreshFeatureFlags } = require('../../utils/featureFlags.js');

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
    // 受云端审核开关控制的内容（默认 true，云开关关闭时变 false）
    showJishenFangWei: true,   // 吉神方位
    showWuxingClothes: true,   // 五行穿衣
    showChongsha: true,        // 冲煞生肖/方向
  },

  onLoad: function () {
    // 防护：getApp() 可能返回 undefined
    let statusBarHeight = 20;
    try {
      const app = getApp();
      if (app && app.globalData) {
        statusBarHeight = app.globalData.statusBarHeight || 20;
      }
    } catch (e) {
      console.warn('[Index] getApp() 不可用', e);
    }

    // 根据云端审核开关计算 3 个区域显隐
    const switchOn = isAuditSwitchOn();

    this.setData({
      statusBarHeight,
      showJishenFangWei: switchOn,   // 吉神方位
      showWuxingClothes: switchOn,   // 五行穿衣
      showChongsha: switchOn,        // 冲煞生肖/方向
    });

    // 异步重新拉取最新云端开关（防 app.js 还没拉完）
    this.recheckAuditSwitch();
  },

  /**
   * 异步重新拉取云端审核开关
   */
  recheckAuditSwitch: function () {
    try {
      refreshFeatureFlags(getApp()).then(() => {
        const switchOn = isAuditSwitchOn();
        const cur = this.data;
        if (cur.showJishenFangWei !== switchOn ||
            cur.showWuxingClothes !== switchOn ||
            cur.showChongsha !== switchOn) {
          this.setData({
            showJishenFangWei: switchOn,
            showWuxingClothes: switchOn,
            showChongsha: switchOn,
          });
        }
      });
    } catch (e) {
      // 静默失败
    }
  },

  onReady: function () {
    // 加载今日黄历数据
    this.loadDailyAlmanac();
  },

  onShow: function () {
    // 自定义 tabBar：设置当前选中
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setSelected('/pages/index/index');
      this.getTabBar().refreshLockStatus && this.getTabBar().refreshLockStatus();
    }
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

    // 尝试从缓存加载
    const cachedData = wx.getStorageSync('daily_almanac_cache');
    if (cachedData) {
      this.applyAlmanacData(cachedData);
    }

    // 云开发未初始化时，直接用模拟数据
    if (!wx.cloud) {
      console.warn('[Index] wx.cloud 不可用，使用模拟数据');
      if (!cachedData) this.setMockData();
      return;
    }

    // 检查是否已初始化（防止 app.js 的 onLaunch 还没跑完）
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
        this.applyAlmanacData(data);

        // 缓存数据
        wx.setStorageSync('daily_almanac_cache', data);
      } else {
        // 数据为空，有缓存用缓存，没有用模拟
        if (!cachedData) {
          this.setMockData();
        }
      }
    } catch (err) {
      // 静默失败，避免控制台噪音（不影响用户使用）
      // 失败时用缓存，没有用模拟
      if (!cachedData) {
        this.setMockData();
      }
    }
  },

  // 应用黄历数据到页面
  applyAlmanacData: function (data) {
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
      chongshaZodiac: '兔',
      chongshaDirection: '东',
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