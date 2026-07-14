// pages/fortune/fortune.js
const { store } = require('../../store/userStore');
const { isFeatureUnlocked } = require('../../utils/featureUnlocks.js');
const { isAuditSwitchOn } = require('../../utils/featureFlags.js');

Page({
  data: {
    statusBarHeight: 20,
    zodiac: '鼠',
    zodiacEmoji: '🐭',
    fortuneList: [],
    isLoading: true,
  },

  onLoad: function () {
    // 拦截：未到解锁时间直接跳回首页（防止其他入口绕过 tabBar）
    if (!isFeatureUnlocked('fortuneTab')) {
      wx.showToast({ title: '功能筹备中', icon: 'none' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1200);
      return;
    }
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
    });

    // 动态设置导航栏标题（审核时显示中性名）
    wx.setNavigationBarTitle({
      title: isAuditSwitchOn() ? '运势速览' : '今日速递',
    });
  },

  onShow: function () {
    // 自定义 tabBar：设置当前选中
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setSelected('/pages/fortune/fortune');
      this.getTabBar().refreshLockStatus && this.getTabBar().refreshLockStatus();
    }
    this.loadFortune();
  },

  onPullDownRefresh: function () {
    this.loadFortune().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载运势数据
  loadFortune: async function () {
    this.setData({ isLoading: true });

    const zodiac = store.zodiac;
    const gender = store.gender;

    // 生肖 emoji 映射
    const zodiacMap = {
      '鼠': '🐭', '牛': '🐮', '虎': '🐯', '兔': '🐰',
      '龙': '🐲', '蛇': '🐍', '马': '🐴', '羊': '🐑',
      '猴': '🐵', '鸡': '🐔', '狗': '🐶', '猪': '🐷',
    };

    this.setData({
      zodiac: zodiac,
      zodiacEmoji: zodiacMap[zodiac] || '🐭',
    });

    try {
      const res = await wx.cloud.callFunction({
        name: 'getFortune',
        data: {
          zodiac: zodiac,
          gender: gender,
        },
      });

      if (res.result && res.result.data) {
        this.setData({
          fortuneList: res.result.data,
          isLoading: false,
        });
        store.setFortuneData(res.result.data);
      } else {
        this.setMockData();
      }
    } catch (err) {
      console.warn('加载运势数据失败', err);
      this.setMockData();
    }
  },

  // 设置模拟数据
  setMockData: function () {
    const gender = store.gender;
    const isMale = gender === '男';

    this.setData({
      fortuneList: [
        { dimension: '事业', content: '今日贵人方位东南，利沟通表达，适合谈判签约。' },
        { dimension: '感情', content: isMale ? '桃花运平稳，已有伴侣者注意沟通细节。' : '爱情运平稳，单身者有机会遇到有缘人。' },
        { dimension: '健康', content: '注意颈椎疲劳，适当活动肩颈。' },
        { dimension: '财运', content: '正财稳定，偏财谨慎。' },
        { dimension: '总体', content: '今日运势平稳上升，保持平常心即可。' },
      ],
      isLoading: false,
    });
  },

  // 跳转到设置页
  goToSettings: function () {
    wx.switchTab({
      url: '/pages/settings/settings?anchor=zodiac',
    });
  },

  // 跳转到八字排盘页
  goToBazi: function () {
    wx.navigateTo({
      url: '/pages/bazi/bazi',
    });
  },
});