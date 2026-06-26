// app.js
const { createStoreBindings } = require('mobx-miniprogram-bindings');
const { store } = require('./store/userStore');
const { env } = require('./env');

App({
  globalData: {
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
        env: env,
        traceUser: true,
      });
    }

    // 获取系统信息
    this.initSystemInfo();

    // 绑定 MobX Store
    this.storeBindings = createStoreBindings(this, store, [
      'zodiac',
      'gender',
      'birthYear',
      'birthMonth',
      'birthDay',
    ]);
  },

  initSystemInfo: function () {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;

    this.globalData.systemInfo = systemInfo;
    this.globalData.statusBarHeight = statusBarHeight || 20;
  },

  onUnload: function () {
    this.storeBindings && this.storeBindings.destroyStoreBindings();
  },
});