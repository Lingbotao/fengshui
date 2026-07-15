// pages/index/index.js
const { createStoreBindings } = require('mobx-miniprogram-bindings');
const { store } = require('../../store/userStore');
const { isAuditSwitchOn, refreshFeatureFlags } = require('../../utils/featureFlags.js');
const { getDailyYiJi } = require('../../utils/zheri-js/index.js');

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
    // 关键：用本地择日算法覆盖云端的 yi/ji
    // 原因：云端 getDailyAlmanac 旧版用 baseYi/baseJi 随机切片，与择日页不同源
    // 改为本地 getDailyYiJi 后，首页和择日页共用同一份 JIAN_CHU_INFO
    let yiList = data.yi || [];
    let jiList = data.ji || [];
    try {
      const dateStr = data.date || this.formatDate(new Date());
      const [y, m, d] = dateStr.split('-').map(Number);
      const localYiJi = getDailyYiJi(y, m, d);
      if (localYiJi && localYiJi.yi && localYiJi.yi.length) yiList = localYiJi.yi;
      if (localYiJi && localYiJi.ji && localYiJi.ji.length) jiList = localYiJi.ji;
    } catch (e) {
      console.warn('[Index] 本地宜忌覆盖失败，回退云端数据', e);
    }

    this.setData({
      lunarDate: data.lunar,
      ganzhiYear: data.ganzhi?.year,
      gregorianDate: data.day,
      weekDay: data.weekDay,
      yiList,
      jiList,
      chongshaZodiac: data.chongsha?.zodiac || '',
      chongshaDirection: data.chongsha?.direction || '',
      caishenDirection: data.jiShenFangWei?.caishen || '正南',
      xishenDirection: data.jiShenFangWei?.xishen || '东南',
      guishenDirection: data.jiShenFangWei?.guishen || '西北',
      wuxingClothes: data.wuXingClothes || [],
      isLoading: false,
    });

    // 保存到 Store（注意：Store 用云端原数据，避免影响其他已稳定依赖 Store 的页面）
    store.setDailyAlmanac(data);
    store.setWuxingClothes(data.wuXingClothes || []);
  },

  // 设置模拟数据（开发调试用，无云能力时）
  setMockData: function () {
    // 同样用本地择日算法生成宜忌，避免无云能力时也出现首页/择日不一致
    let yiList = ['祭祀', '祈福', '开光', '订盟', '纳采'];
    let jiList = ['动土', '破土', '安葬', '针灸', '伐木'];
    try {
      const now = new Date();
      const localYiJi = getDailyYiJi(now.getFullYear(), now.getMonth() + 1, now.getDate());
      if (localYiJi && localYiJi.yi && localYiJi.yi.length) yiList = localYiJi.yi;
      if (localYiJi && localYiJi.ji && localYiJi.ji.length) jiList = localYiJi.ji;
    } catch (e) {
      console.warn('[Index] setMockData 本地宜忌生成失败', e);
    }

    this.setData({
      lunarDate: '六月十二',
      ganzhiYear: '乙巳年',
      gregorianDate: '23',
      weekDay: '星期一',
      yiList,
      jiList,
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