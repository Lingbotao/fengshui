// app.js
const { createStoreBindings } = require('mobx-miniprogram-bindings');
const { store } = require('./store/userStore');

App({
  globalData: {
    // 云开发环境 ID，需在微信开发者工具中获取
    env: '',
    // 系统信息
    systemInfo: null,
    statusBarHeight: 0,
  },

  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }

    // 获取系统信息
    this.initSystemInfo();
  },

  initSystemInfo: function () {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 20;
    this.globalData.systemInfo = systemInfo;
    this.globalData.statusBarHeight = statusBarHeight;
  },

  onShow: function () {
    // 每次小程序显示时，检查本地缓存的用户设置
    this.checkUserSettings();
  },

  checkUserSettings: function () {
    const userSettings = wx.getStorageSync('user_settings');
    if (userSettings) {
      // 更新 Store 中的用户设置
      if (store) {
        store.updateUserSettings(userSettings);
      }
    }
  },
});